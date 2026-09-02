import { getAuthenticatedStaff, json } from './_lib/supabase.js'

const roles = ['owner', 'manager', 'front_desk', 'staff']

function optionalText(value, maxLength) {
  const normalized = String(value ?? '').trim()
  return normalized ? normalized.slice(0, maxLength) : null
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const auth = await getAuthenticatedStaff(request, roles)
  if (auth.error) {
    return json(response, auth.status, { error: auth.error })
  }

  const displayName = String(request.body?.displayName ?? '').trim()
  const color = String(request.body?.color ?? '')
  if (
    displayName.length < 1 ||
    displayName.length > 80 ||
    !/^#[0-9a-f]{6}$/i.test(color)
  ) {
    return json(response, 400, { error: 'invalid_input' })
  }

  const { data, error } = await auth.adminClient
    .from('staff_profiles')
    .update({
      display_name: displayName,
      phone: optionalText(request.body?.phone, 40),
      color,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auth.profile.id)
    .select('*')
    .single()

  if (error || !data) {
    return json(response, 500, { error: 'profile_update_failed' })
  }

  return json(response, 200, { profile: data })
}
