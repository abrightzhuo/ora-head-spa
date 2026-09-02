import { getAuthenticatedStaff, json } from './_lib/supabase.js'

const roles = ['owner', 'manager']
const mimeExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const bucketName = 'provider-photos'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const auth = await getAuthenticatedStaff(request, roles)
  if (auth.error) {
    return json(response, auth.status, { error: auth.error })
  }
  const providerId = String(request.body?.providerId ?? '')
  const { data: provider, error: providerError } = await auth.adminClient
    .from('staff_profiles')
    .select('id, role')
    .eq('id', providerId)
    .single()
  if (providerError || !provider || provider.role !== 'staff') {
    return json(response, 404, { error: 'provider_not_found' })
  }

  const match = String(request.body?.image ?? '').match(
    /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/,
  )
  if (!match) {
    return json(response, 400, { error: 'invalid_image' })
  }

  const [, contentType, encoded] = match
  const file = Buffer.from(encoded, 'base64')
  if (file.length === 0 || file.length > 3 * 1024 * 1024) {
    return json(response, 413, { error: 'image_too_large' })
  }

  const { error: bucketError } =
    await auth.adminClient.storage.getBucket(bucketName)
  if (bucketError) {
    const { error: createError } =
      await auth.adminClient.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 3 * 1024 * 1024,
        allowedMimeTypes: Object.keys(mimeExtensions),
      })
    if (createError && !/already exists/i.test(createError.message)) {
      return json(response, 500, { error: 'storage_unavailable' })
    }
  }

  const path =
    `${providerId}/profile-${Date.now()}.` +
    mimeExtensions[contentType]
  const { error: uploadError } = await auth.adminClient.storage
    .from(bucketName)
    .upload(path, file, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    })
  if (uploadError) {
    return json(response, 500, { error: 'photo_upload_failed' })
  }

  const { data: publicData } = auth.adminClient.storage
    .from(bucketName)
    .getPublicUrl(path)
  const photoUrl = publicData.publicUrl
  const { data: profile, error: profileError } = await auth.adminClient
    .from('staff_profiles')
    .update({
      photo_url: photoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', providerId)
    .select('*')
    .single()

  if (profileError || !profile) {
    await auth.adminClient.storage.from(bucketName).remove([path])
    return json(response, 500, { error: 'profile_update_failed' })
  }

  return json(response, 200, { profile })
}
