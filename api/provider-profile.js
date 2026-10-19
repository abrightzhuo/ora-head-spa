import { getAuthenticatedStaff, json } from './_lib/supabase.js'

const managerRoles = ['owner', 'manager']
const photoBucket = 'provider-photos'
const photoMimeExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const photoMaxSize = 3 * 1024 * 1024

async function saveProviderPhoto(client, providerId, image) {
  const match = String(image ?? '').match(
    /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/,
  )
  if (!match) return { error: 'invalid_image', status: 400 }

  const [, contentType, encoded] = match
  const file = Buffer.from(encoded, 'base64')
  if (file.length === 0 || file.length > photoMaxSize) {
    return { error: 'image_too_large', status: 413 }
  }

  const { error: bucketError } = await client.storage.getBucket(photoBucket)
  if (bucketError) {
    const { error: createError } = await client.storage.createBucket(
      photoBucket,
      {
        public: true,
        fileSizeLimit: photoMaxSize,
        allowedMimeTypes: Object.keys(photoMimeExtensions),
      },
    )
    if (createError && !/already exists/i.test(createError.message)) {
      return { error: 'storage_unavailable', status: 500 }
    }
  }

  const path =
    `${providerId}/profile-${Date.now()}.` + photoMimeExtensions[contentType]
  const { error: uploadError } = await client.storage
    .from(photoBucket)
    .upload(path, file, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    })
  if (uploadError) return { error: 'photo_upload_failed', status: 500 }

  const { data: publicData } = client.storage
    .from(photoBucket)
    .getPublicUrl(path)
  const { data: profile, error } = await client
    .from('staff_profiles')
    .update({
      photo_url: publicData.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', providerId)
    .select('*')
    .single()

  if (error || !profile) {
    await client.storage.from(photoBucket).remove([path])
    return { error: 'profile_update_failed', status: 500 }
  }

  return { profile }
}

function optionalText(value, maxLength) {
  const normalized = String(value ?? '').trim()
  return normalized ? normalized.slice(0, maxLength) : null
}

function textList(value, maxItems, maxLength) {
  return Array.isArray(value)
    ? value
        .map((item) => String(item).trim().slice(0, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : []
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const auth = await getAuthenticatedStaff(request, managerRoles)
  if (auth.error) {
    return json(response, auth.status, { error: auth.error })
  }

  const providerId = String(request.body?.providerId ?? '')
  const { data: provider, error: providerError } = await auth.adminClient
    .from('staff_profiles')
    .select('id, role, active')
    .eq('id', providerId)
    .single()
  if (providerError || !provider || provider.role !== 'staff') {
    return json(response, 404, { error: 'provider_not_found' })
  }

  if (request.body?.action === 'photo') {
    const result = await saveProviderPhoto(
      auth.adminClient,
      providerId,
      request.body?.image,
    )
    if (result.error) {
      return json(response, result.status, { error: result.error })
    }
    return json(response, 200, { profile: result.profile })
  }

  const experienceYears = request.body?.experienceYears
  if (
    experienceYears !== null &&
    (!Number.isInteger(experienceYears) ||
      experienceYears < 0 ||
      experienceYears > 80)
  ) {
    return json(response, 400, { error: 'invalid_input' })
  }

  const { data, error } = await auth.adminClient
    .from('staff_profiles')
    .update({
      bio: optionalText(request.body?.bio, 600),
      profile_headline: optionalText(request.body?.profileHeadline, 120),
      specialties: textList(request.body?.specialties, 12, 80),
      languages: textList(request.body?.languages, 12, 40),
      experience_years: experienceYears,
      updated_at: new Date().toISOString(),
    })
    .eq('id', providerId)
    .select('*')
    .single()

  if (error || !data) {
    return json(response, 500, { error: 'provider_update_failed' })
  }

  return json(response, 200, { profile: data })
}
