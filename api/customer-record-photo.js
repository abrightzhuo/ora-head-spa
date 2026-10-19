import { getAuthenticatedStaff, json } from './_lib/supabase.js'

const bucketName = 'customer-care-photos'
const mimeExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const maxFileSize = 3 * 1024 * 1024
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function ensureBucket(client) {
  const { error } = await client.storage.getBucket(bucketName)
  if (!error) return true

  const { error: createError } = await client.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: maxFileSize,
    allowedMimeTypes: Object.keys(mimeExtensions),
  })
  return !createError || /already exists/i.test(createError.message)
}

export default async function handler(request, response) {
  const auth = await getAuthenticatedStaff(request)
  if (auth.error) {
    return json(response, auth.status, { error: auth.error })
  }
  const { adminClient } = auth

  if (request.method === 'DELETE') {
    const customerId = String(request.body?.customerId ?? '').trim()
    const path = String(request.body?.path ?? '').trim()
    if (
      !uuidPattern.test(customerId) ||
      !path.startsWith(`${customerId}/`) ||
      !/^[0-9a-f-]{36}\/(before|after)-\d+\.(jpg|png|webp)$/i.test(path)
    ) {
      return json(response, 400, { error: 'invalid_path' })
    }

    const { error } = await adminClient.storage.from(bucketName).remove([path])
    if (error) {
      return json(response, 500, { error: 'delete_failed' })
    }
    return json(response, 200, { ok: true })
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, DELETE')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const customerId = String(request.body?.customerId ?? '').trim()
  const kind = String(request.body?.kind ?? '').trim()
  if (!uuidPattern.test(customerId) || !['before', 'after'].includes(kind)) {
    return json(response, 400, { error: 'invalid_request' })
  }

  const { data: customer, error: customerError } = await adminClient
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .maybeSingle()
  if (customerError) {
    return json(response, 500, { error: 'lookup_failed' })
  }
  if (!customer) {
    return json(response, 404, { error: 'customer_not_found' })
  }

  const match = String(request.body?.image ?? '').match(
    /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/,
  )
  if (!match) {
    return json(response, 400, { error: 'invalid_image' })
  }

  const [, contentType, encoded] = match
  const file = Buffer.from(encoded, 'base64')
  if (file.length === 0 || file.length > maxFileSize) {
    return json(response, 413, { error: 'image_too_large' })
  }

  if (!(await ensureBucket(adminClient))) {
    return json(response, 500, { error: 'storage_unavailable' })
  }

  const path = `${customerId}/${kind}-${Date.now()}.${mimeExtensions[contentType]}`
  const { error: uploadError } = await adminClient.storage
    .from(bucketName)
    .upload(path, file, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    })
  if (uploadError) {
    return json(response, 500, { error: 'photo_upload_failed' })
  }

  const { data: signed } = await adminClient.storage
    .from(bucketName)
    .createSignedUrl(path, 60 * 60)

  return json(response, 200, { path, url: signed?.signedUrl ?? null })
}
