import { getAuthenticatedStaff, json } from './_lib/supabase.js'

const managerRoles = ['owner', 'manager']

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
