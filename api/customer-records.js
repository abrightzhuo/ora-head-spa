import { getAuthenticatedStaff, json } from './_lib/supabase.js'

const bucketName = 'customer-care-photos'
const signedUrlTtl = 60 * 60
const deleteRoles = ['owner', 'manager']
const photoMimeExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const photoMaxSize = 3 * 1024 * 1024
const scalpPhotoLimit = 6
const photoPathPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(before|after|scalp)-\d+\.(jpg|png|webp)$/i
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
    `^${customerId}/(before|after|scalp)-\\d+\\.(jpg|png|webp)$`,
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

async function signPhotoMap(client, paths) {
  const unique = [...new Set(paths.filter(Boolean))]
  if (unique.length === 0) return new Map()

  const { data, error } = await client.storage
    .from(bucketName)
    .createSignedUrls(unique, signedUrlTtl)
  if (error || !data) return new Map()

  return new Map(data.map((item) => [item.path, item.signedUrl ?? null]))
}

function profileWithUrls(profile, signed) {
  if (!profile) return null
  const paths = Array.isArray(profile.scalp_photos) ? profile.scalp_photos : []
  return {
    ...profile,
    scalpPhotoUrls: paths.map((path) => signed.get(path) ?? ''),
  }
}

async function withScalpPhotoUrls(client, profile) {
  if (!profile) return null
  const paths = Array.isArray(profile.scalp_photos) ? profile.scalp_photos : []
  const signed = await signPhotoMap(client, paths)
  return profileWithUrls(profile, signed)
}

async function loadCareProfile(client, customerId) {
  const { data, error } = await client
    .from('customer_care_profiles')
    .select('*')
    .eq('customer_id', customerId)
    .maybeSingle()
  if (error) return { error: 'load_failed' }
  return { profile: data ?? null }
}

async function ensurePhotoBucket(client) {
  const { error } = await client.storage.getBucket(bucketName)
  if (!error) return true

  const { error: createError } = await client.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: photoMaxSize,
    allowedMimeTypes: Object.keys(photoMimeExtensions),
  })
  return !createError || /already exists/i.test(createError.message)
}

async function uploadCarePhoto(client, customerId, kind, image) {
  const match = String(image ?? '').match(
    /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/,
  )
  if (!match) return { error: 'invalid_image', status: 400 }

  const [, contentType, encoded] = match
  const file = Buffer.from(encoded, 'base64')
  if (file.length === 0 || file.length > photoMaxSize) {
    return { error: 'image_too_large', status: 413 }
  }

  if (!(await ensurePhotoBucket(client))) {
    return { error: 'storage_unavailable', status: 500 }
  }

  const path =
    `${customerId}/${kind}-${Date.now()}.` + photoMimeExtensions[contentType]
  const { error: uploadError } = await client.storage
    .from(bucketName)
    .upload(path, file, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    })
  if (uploadError) return { error: 'photo_upload_failed', status: 500 }

  const { data: signed } = await client.storage
    .from(bucketName)
    .createSignedUrl(path, signedUrlTtl)

  return { path, url: signed?.signedUrl ?? null }
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

  const profile = profileResult.data ?? null
  const records = recordsResult.data ?? []
  const signed = await signPhotoMap(client, [
    ...(Array.isArray(profile?.scalp_photos) ? profile.scalp_photos : []),
    ...records.flatMap((record) => [
      record.before_photo_path,
      record.after_photo_path,
    ]),
  ])

  return {
    profile: profileWithUrls(profile, signed),
    records: records.map((record) => ({
      ...record,
      beforePhotoUrl: signed.get(record.before_photo_path) ?? null,
      afterPhotoUrl: signed.get(record.after_photo_path) ?? null,
    })),
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
    const photoPathValue = String(request.query?.photoPath ?? '')
    if (photoPathValue) {
      if (!photoPathPattern.test(photoPathValue)) {
        return json(response, 400, { error: 'invalid_path' })
      }
      const { error } = await adminClient.storage
        .from(bucketName)
        .remove([photoPathValue])
      if (error) {
        return json(response, 500, { error: 'delete_failed' })
      }
      return json(response, 200, { ok: true })
    }

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

  if (action === 'upload-photo') {
    const kind = String(request.body?.kind ?? '').trim()
    if (!['before', 'after'].includes(kind)) {
      return json(response, 400, { error: 'invalid_request' })
    }

    const result = await uploadCarePhoto(
      adminClient,
      customerId,
      kind,
      request.body?.image,
    )
    if (result.error) {
      return json(response, result.status, { error: result.error })
    }
    return json(response, 200, { path: result.path, url: result.url })
  }

  if (action === 'upload-scalp-photo') {
    const current = await loadCareProfile(adminClient, customerId)
    if (current.error) {
      return json(response, 500, { error: current.error })
    }
    const paths = Array.isArray(current.profile?.scalp_photos)
      ? current.profile.scalp_photos
      : []
    if (paths.length >= scalpPhotoLimit) {
      return json(response, 400, { error: 'photo_limit' })
    }

    const uploaded = await uploadCarePhoto(
      adminClient,
      customerId,
      'scalp',
      request.body?.image,
    )
    if (uploaded.error) {
      return json(response, uploaded.status, { error: uploaded.error })
    }

    const { data, error } = await adminClient
      .from('customer_care_profiles')
      .upsert(
        {
          customer_id: customerId,
          scalp_photos: [...paths, uploaded.path],
          updated_by: profile.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'customer_id' },
      )
      .select('*')
      .single()

    if (error || !data) {
      await adminClient.storage.from(bucketName).remove([uploaded.path])
      return json(response, 500, { error: 'save_failed' })
    }

    return json(response, 200, {
      profile: await withScalpPhotoUrls(adminClient, data),
    })
  }

  if (action === 'remove-scalp-photo') {
    const current = await loadCareProfile(adminClient, customerId)
    if (current.error) {
      return json(response, 500, { error: current.error })
    }

    const path = photoPath(request.body?.path, customerId)
    const paths = Array.isArray(current.profile?.scalp_photos)
      ? current.profile.scalp_photos
      : []
    if (!path || !paths.includes(path)) {
      return json(response, 404, { error: 'photo_not_found' })
    }

    const { data, error } = await adminClient
      .from('customer_care_profiles')
      .update({
        scalp_photos: paths.filter((item) => item !== path),
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('customer_id', customerId)
      .select('*')
      .single()

    if (error || !data) {
      return json(response, 500, { error: 'save_failed' })
    }

    await adminClient.storage.from(bucketName).remove([path])
    return json(response, 200, {
      profile: await withScalpPhotoUrls(adminClient, data),
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
    return json(response, 200, {
      profile: await withScalpPhotoUrls(adminClient, data),
    })
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
