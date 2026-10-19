import { getAuthenticatedStaff, json } from './_lib/supabase.js'

const bucketName = 'customer-care-photos'
const signedUrlTtl = 60 * 60
const deleteRoles = ['owner', 'manager']
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const datePattern = /^\d{4}-\d{2}-\d{2}$/

function text(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength)
}

function uuidOrNull(value) {
  const candidate = String(value ?? '').trim()
  return uuidPattern.test(candidate) ? candidate : null
}

function uuidList(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item) => uuidPattern.test(String(item))))].slice(
    0,
    20,
  )
}

function textList(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => text(item, 120))
    .filter(Boolean)
    .slice(0, 20)
}

function photoPath(value, customerId) {
  const candidate = String(value ?? '').trim()
  if (!candidate) return null
  const allowed = new RegExp(
    `^${customerId}/(before|after)-\\d+\\.(jpg|png|webp)$`,
  )
  return allowed.test(candidate) ? candidate : null
}

async function signPhoto(client, path) {
  if (!path) return null
  const { data, error } = await client.storage
    .from(bucketName)
    .createSignedUrl(path, signedUrlTtl)
  if (error) return null
  return data?.signedUrl ?? null
}

async function withSignedPhotos(client, records) {
  return Promise.all(
    records.map(async (record) => ({
      ...record,
      beforePhotoUrl: await signPhoto(client, record.before_photo_path),
      afterPhotoUrl: await signPhoto(client, record.after_photo_path),
    })),
  )
}

async function findCustomer(client, customerId) {
  const { data, error } = await client
    .from('customers')
    .select('id, name, phone')
    .eq('id', customerId)
    .maybeSingle()
  if (error) return { error: 'lookup_failed' }
  if (!data) return { error: 'customer_not_found' }
  return { customer: data }
}

async function loadRecords(client, customerId) {
  const [profileResult, recordsResult] = await Promise.all([
    client
      .from('customer_care_profiles')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle(),
    client
      .from('customer_care_records')
      .select('*')
      .eq('customer_id', customerId)
      .order('record_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  if (profileResult.error || recordsResult.error) {
    return { error: 'load_failed' }
  }

  return {
    profile: profileResult.data ?? null,
    records: await withSignedPhotos(client, recordsResult.data ?? []),
  }
}

export default async function handler(request, response) {
  const auth = await getAuthenticatedStaff(request)
  if (auth.error) {
    return json(response, auth.status, { error: auth.error })
  }
  const { adminClient, profile } = auth

  if (request.method === 'GET') {
    const customerId = String(request.query?.customerId ?? '').trim()
    if (!uuidPattern.test(customerId)) {
      return json(response, 400, { error: 'invalid_customer' })
    }

    const found = await findCustomer(adminClient, customerId)
    if (found.error) {
      return json(response, found.error === 'customer_not_found' ? 404 : 500, {
        error: found.error,
      })
    }

    const result = await loadRecords(adminClient, customerId)
    if (result.error) {
      return json(response, 500, { error: result.error })
    }
    return json(response, 200, result)
  }

  if (request.method === 'DELETE') {
    if (!deleteRoles.includes(profile.role)) {
      return json(response, 403, { error: 'forbidden' })
    }

    const recordId = uuidOrNull(request.query?.id ?? request.body?.id)
    if (!recordId) {
      return json(response, 400, { error: 'invalid_record' })
    }

    const { data: record, error: recordError } = await adminClient
      .from('customer_care_records')
      .select('*')
      .eq('id', recordId)
      .maybeSingle()
    if (recordError) {
      return json(response, 500, { error: 'load_failed' })
    }
    if (!record) {
      return json(response, 404, { error: 'record_not_found' })
    }

    const { error: deleteError } = await adminClient
      .from('customer_care_records')
      .delete()
      .eq('id', recordId)
    if (deleteError) {
      return json(response, 500, { error: 'delete_failed' })
    }

    const paths = [record.before_photo_path, record.after_photo_path].filter(
      Boolean,
    )
    if (paths.length > 0) {
      await adminClient.storage.from(bucketName).remove(paths)
    }

    return json(response, 200, { ok: true })
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST, DELETE')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const action = String(request.body?.action ?? '')
  const customerId = String(request.body?.customerId ?? '').trim()
  if (!uuidPattern.test(customerId)) {
    return json(response, 400, { error: 'invalid_customer' })
  }

  const found = await findCustomer(adminClient, customerId)
  if (found.error) {
    return json(response, found.error === 'customer_not_found' ? 404 : 500, {
      error: found.error,
    })
  }

  if (action === 'save-profile') {
    const { data, error } = await adminClient
      .from('customer_care_profiles')
      .upsert(
        {
          customer_id: customerId,
          allergies: text(request.body?.allergies, 2000),
          health_notes: text(request.body?.healthNotes, 4000),
          scalp_baseline: text(request.body?.scalpBaseline, 4000),
          updated_by: profile.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'customer_id' },
      )
      .select('*')
      .single()

    if (error || !data) {
      return json(response, 500, { error: 'save_failed' })
    }
    return json(response, 200, { profile: data })
  }

  if (action === 'save-record') {
    const recordDate = text(request.body?.recordDate, 10)
    if (!datePattern.test(recordDate)) {
      return json(response, 400, { error: 'invalid_date' })
    }

    const recordId = uuidOrNull(request.body?.recordId)
    const payload = {
      customer_id: customerId,
      record_date: recordDate,
      service_ids: uuidList(request.body?.serviceIds),
      service_names: textList(request.body?.serviceNames),
      provider_id: uuidOrNull(request.body?.providerId),
      scalp_assessment: text(request.body?.scalpAssessment, 6000),
      treatment_notes: text(request.body?.treatmentNotes, 6000),
      follow_up: text(request.body?.followUp, 2000),
      before_photo_path: photoPath(
        request.body?.beforePhotoPath,
        customerId,
      ),
      after_photo_path: photoPath(request.body?.afterPhotoPath, customerId),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    }

    if (!recordId) {
      payload.created_by = profile.id
    }

    const query = recordId
      ? adminClient
          .from('customer_care_records')
          .update(payload)
          .eq('id', recordId)
          .eq('customer_id', customerId)
      : adminClient.from('customer_care_records').insert(payload)

    const { data, error } = await query.select('*').single()
    if (error || !data) {
      return json(response, 500, { error: 'save_failed' })
    }

    const [record] = await withSignedPhotos(adminClient, [data])
    return json(response, 200, { record })
  }

  return json(response, 400, { error: 'unknown_action' })
}
