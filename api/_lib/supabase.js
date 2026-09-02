import { createClient } from '@supabase/supabase-js'

export function json(response, status, body) {
  response.status(status).json(body)
}

export function getServerClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return null

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function getBearerToken(request) {
  const authorization = request.headers.authorization ?? ''
  return authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''
}

export async function getAuthenticatedUser(request) {
  const adminClient = getServerClient()
  const token = getBearerToken(request)

  if (!adminClient) {
    return { error: 'server_not_configured', status: 500 }
  }

  if (!token) {
    return { error: 'authentication_required', status: 401 }
  }

  const { data, error } = await adminClient.auth.getUser(token)
  const user = data.user

  if (error || !user?.email) {
    return { error: 'authentication_required', status: 401 }
  }

  if (!user.email_confirmed_at) {
    return { error: 'email_confirmation_required', status: 403 }
  }

  return {
    adminClient,
    token,
    user,
    email: user.email.trim().toLowerCase(),
  }
}

export async function getAuthenticatedStaff(request, roles) {
  const adminClient = getServerClient()
  const token = getBearerToken(request)

  if (!adminClient) {
    return { error: 'server_not_configured', status: 500 }
  }

  if (!token) {
    return { error: 'unauthorized', status: 401 }
  }

  const { data: userData, error: userError } =
    await adminClient.auth.getUser(token)

  if (userError || !userData.user) {
    return { error: 'unauthorized', status: 401 }
  }

  const { data: profile, error: profileError } = await adminClient
    .from('staff_profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single()

  if (
    profileError ||
    !profile?.active ||
    (roles && !roles.includes(profile.role))
  ) {
    return { error: 'forbidden', status: 403 }
  }

  return {
    adminClient,
    user: userData.user,
    profile,
  }
}
