import { createClient } from '@supabase/supabase-js'

const json = (response, status, body) => {
  response.status(status).setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

export default async function handler(request, response) {
  if (!['POST', 'DELETE'].includes(request.method)) {
    response.setHeader('Allow', 'POST, DELETE')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const anonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(response, 500, { error: 'server_not_configured' })
  }

  const authorization = request.headers.authorization
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null

  if (!token) {
    return json(response, 401, { error: 'unauthorized' })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userError } =
    await userClient.auth.getUser(token)

  if (userError || !userData.user) {
    return json(response, 401, { error: 'unauthorized' })
  }

  const { data: adminProfile, error: profileError } = await userClient
    .from('staff_profiles')
    .select('role, active')
    .eq('id', userData.user.id)
    .single()

  if (
    profileError ||
    !adminProfile?.active ||
    !['owner', 'manager'].includes(adminProfile.role)
  ) {
    return json(response, 403, { error: 'manager_required' })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (request.method === 'DELETE') {
    const operatorId =
      typeof request.body?.operatorId === 'string'
        ? request.body.operatorId.trim()
        : ''

    if (!operatorId) {
      return json(response, 400, { error: 'invalid_input' })
    }

    if (operatorId === userData.user.id) {
      return json(response, 409, { error: 'self_delete_forbidden' })
    }

    const { data: operator, error: operatorError } = await adminClient
      .from('staff_profiles')
      .select('*')
      .eq('id', operatorId)
      .single()

    if (operatorError || !operator) {
      return json(response, 404, { error: 'operator_not_found' })
    }

    if (!operator.active) {
      return json(response, 409, { error: 'operator_inactive' })
    }

    if (
      adminProfile.role === 'manager' &&
      ['owner', 'manager'].includes(operator.role)
    ) {
      return json(response, 403, { error: 'role_forbidden' })
    }

    if (operator.role === 'owner') {
      const { count, error: countError } = await adminClient
        .from('staff_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'owner')
        .eq('active', true)

      if (countError) {
        return json(response, 500, { error: 'delete_failed' })
      }

      if ((count ?? 0) <= 1) {
        return json(response, 409, { error: 'last_owner_forbidden' })
      }
    }

    const { error: banError } = await adminClient.auth.admin.updateUserById(
      operatorId,
      { ban_duration: '876000h' },
    )

    if (banError) {
      return json(response, 500, { error: 'delete_failed' })
    }

    const { data: disabledOperator, error: disableError } = await adminClient
      .from('staff_profiles')
      .update({ active: false })
      .eq('id', operatorId)
      .select('*')
      .single()

    if (disableError || !disabledOperator) {
      await adminClient.auth.admin.updateUserById(operatorId, {
        ban_duration: 'none',
      })
      return json(response, 500, { error: 'delete_failed' })
    }

    const { data: audit, error: auditError } = await adminClient
      .from('operator_account_history')
      .insert({
        operator_id: operatorId,
        action: 'deleted',
        acted_by: userData.user.id,
      })
      .select('id, operator_id, action, acted_by, acted_at')
      .single()

    if (auditError || !audit) {
      await adminClient
        .from('staff_profiles')
        .update({ active: true })
        .eq('id', operatorId)
      await adminClient.auth.admin.updateUserById(operatorId, {
        ban_duration: 'none',
      })
      return json(response, 500, { error: 'audit_failed' })
    }

    return json(response, 200, {
      operator: disabledOperator,
      audit,
    })
  }

  const email =
    typeof request.body?.email === 'string'
      ? request.body.email.trim().toLowerCase()
      : ''
  const displayName =
    typeof request.body?.displayName === 'string'
      ? request.body.displayName.trim()
      : ''
  const password =
    typeof request.body?.password === 'string'
      ? request.body.password
      : ''
  const role =
    typeof request.body?.role === 'string' &&
    ['owner', 'manager', 'front_desk', 'staff'].includes(request.body.role)
      ? request.body.role
      : ''
  const bookable = role === 'staff' && request.body?.bookable !== false

  if (
    !email ||
    !email.includes('@') ||
    displayName.length < 1 ||
    displayName.length > 80 ||
    password.length < 8 ||
    !role
  ) {
    return json(response, 400, { error: 'invalid_input' })
  }

  if (
    adminProfile.role === 'manager' &&
    ['owner', 'manager'].includes(role)
  ) {
    return json(response, 403, { error: 'role_forbidden' })
  }

  const { data: createdUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, role },
    })

  if (createError || !createdUser.user) {
    const duplicate = /already|registered|exists/i.test(
      createError?.message ?? '',
    )
    return json(response, duplicate ? 409 : 400, {
      error: duplicate ? 'email_exists' : 'create_failed',
    })
  }

  const { data: profile, error: insertError } = await adminClient
    .from('staff_profiles')
    .insert({
      id: createdUser.user.id,
      email,
      display_name: displayName,
      role,
      active: true,
      bookable,
      created_by: userData.user.id,
    })
    .select('*')
    .single()

  if (insertError || !profile) {
    await adminClient.auth.admin.deleteUser(createdUser.user.id)
    return json(response, 500, { error: 'profile_create_failed' })
  }

  const { data: audit, error: auditError } = await adminClient
    .from('operator_account_history')
    .insert({
      operator_id: profile.id,
      action: 'created',
      acted_by: userData.user.id,
    })
    .select('id, operator_id, action, acted_by, acted_at')
    .single()

  if (auditError || !audit) {
    await adminClient.auth.admin.deleteUser(createdUser.user.id)
    return json(response, 500, { error: 'audit_failed' })
  }

  return json(response, 201, { operator: profile, audit })
}
