import {
  getAuthenticatedStaff,
  getAuthenticatedUser,
  json,
} from './_lib/supabase.js'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const phonePattern = /^[+\d][\d\s()-]{6,}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const squareApiVersion = '2025-07-16'
const paymentPolicyVersion = '2026-08-28'
const paymentPolicyConsent =
  'I authorize ORA to securely store this payment method with Square and charge 15% of the booked service price for cancellations or changes within 24 hours, or 50% for a no-show.'

function dateInTimezone(value, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const get = (type) => parts.find((part) => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

function membershipServicePrice(service, startsAt, membership) {
  const basePrice = service.price_cents
  if (
    !membership ||
    membership.status !== 'active' ||
    new Date(membership.starts_at).getTime() > startsAt.getTime() ||
    new Date(membership.expires_at).getTime() <= startsAt.getTime()
  ) {
    return basePrice
  }
  if (
    !membership.complimentary_redeemed_at &&
    membership.complimentary_service_code === service.code
  ) {
    return 0
  }

  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  }).format(startsAt)
  const discountBps = ['Mon', 'Tue', 'Wed', 'Thu'].includes(weekday)
    ? 2000
    : 1000
  return Math.round(basePrice * (1 - discountBps / 10000))
}

async function createWalkIn(request, response) {
  const authenticated = await getAuthenticatedStaff(request, [
    'owner',
    'manager',
    'front_desk',
    'staff',
  ])
  if (authenticated.error) {
    return json(response, authenticated.status, {
      error: authenticated.error,
    })
  }

  const { adminClient, profile } = authenticated
  const customerId =
    typeof request.body?.customerId === 'string'
      ? request.body.customerId
      : ''
  const serviceId =
    typeof request.body?.serviceId === 'string'
      ? request.body.serviceId
      : ''
  const providerId =
    typeof request.body?.providerId === 'string'
      ? request.body.providerId
      : ''
  const startsAt =
    typeof request.body?.startsAt === 'string'
      ? request.body.startsAt
      : ''
  const notes =
    typeof request.body?.notes === 'string'
      ? request.body.notes.trim().slice(0, 1000)
      : ''
  const start = new Date(startsAt)

  if (
    !uuidPattern.test(customerId) ||
    !uuidPattern.test(serviceId) ||
    !uuidPattern.test(providerId) ||
    Number.isNaN(start.getTime())
  ) {
    return json(response, 400, { error: 'invalid_input' })
  }

  const [
    { data: customer, error: customerError },
    { data: service, error: serviceError },
    { data: provider, error: providerError },
    { data: settings, error: settingsError },
  ] = await Promise.all([
    adminClient
      .from('customers')
      .select('id, auth_user_id, name, phone, email')
      .eq('id', customerId)
      .single(),
    adminClient
      .from('services')
      .select('id, name, duration_minutes, active')
      .eq('id', serviceId)
      .single(),
    adminClient
      .from('staff_profiles')
      .select('id, active')
      .eq('id', providerId)
      .single(),
    adminClient
      .from('business_settings')
      .select('timezone')
      .eq('id', 1)
      .single(),
  ])

  if (customerError || !customer) {
    return json(response, 404, { error: 'customer_not_found' })
  }
  if (serviceError || !service?.active) {
    return json(response, 404, { error: 'service_not_found' })
  }
  if (providerError || !provider?.active) {
    return json(response, 404, { error: 'provider_not_found' })
  }
  if (settingsError || !settings?.timezone) {
    return json(response, 500, { error: 'settings_unavailable' })
  }

  const end = new Date(
    start.getTime() + service.duration_minutes * 60 * 1000,
  )
  const { data: appointment, error } = await adminClient
    .from('appointments')
    .insert({
      customer_id: customer.id,
      customer_user_id: customer.auth_user_id,
      customer_name: customer.name,
      customer_email: customer.email,
      phone: customer.phone,
      service: service.name,
      service_id: service.id,
      provider_id: provider.id,
      preferred_date: dateInTimezone(start, settings.timezone),
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      message: null,
      locale: 'en',
      status: 'checked_in',
      source: 'walk_in',
      internal_notes: notes || null,
      updated_by: profile.id,
      status_changed_by: profile.id,
      status_changed_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error || !appointment) {
    const conflict =
      error?.code === '23P01' ||
      error?.message?.includes('appointments_provider_time_excl')
    return json(response, conflict ? 409 : 500, {
      error: conflict ? 'provider_unavailable' : 'walk_in_create_failed',
    })
  }

  return json(response, 201, { appointment })
}

async function customerRecords(request, response) {
  const authenticated = await getAuthenticatedUser(request)
  if (authenticated.error) {
    return json(response, authenticated.status, {
      error: authenticated.error,
    })
  }

  const { adminClient, user, email } = authenticated
  const contactEmail =
    typeof user.user_metadata?.contact_email === 'string'
      ? user.user_metadata.contact_email.trim().toLowerCase()
      : email
  const claims = await Promise.all([
    adminClient
      .from('appointments')
      .update({ customer_user_id: user.id })
      .is('customer_user_id', null)
      .eq('customer_email', email),
    adminClient
      .from('gift_cards')
      .update({ purchaser_user_id: user.id })
      .is('purchaser_user_id', null)
      .eq('purchaser_email', email),
    adminClient
      .from('gift_cards')
      .update({ recipient_user_id: user.id })
      .is('recipient_user_id', null)
      .eq('recipient_email', email),
  ])

  if (claims.some((result) => result.error)) {
    return json(response, 500, {
      error: 'customer_account_setup_required',
    })
  }

    const [appointmentsResult, giftCardsResult, membershipsResult] =
      await Promise.all([
    adminClient
      .from('appointments')
      .select(
        'id, customer_name, service, provider_id, starts_at, ends_at, status, preferred_date, created_at',
      )
      .eq('customer_user_id', user.id)
      .order('starts_at', { ascending: false }),
    adminClient
      .from('gift_cards')
      .select(
        'id, last_four, initial_balance_cents, balance_cents, currency, recipient_name, recipient_email, purchaser_name, purchaser_email, personal_message, active, expires_at, created_at, purchaser_user_id, recipient_user_id',
      )
      .or(
        `purchaser_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`,
      )
      .order('created_at', { ascending: false }),
      adminClient
        .from('memberships')
        .select(
          'id, status, complimentary_service_code, complimentary_redeemed_at, price_cents, currency, starts_at, expires_at, receipt_url, payment_environment, created_at',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      ])

    if (
      appointmentsResult.error ||
      giftCardsResult.error ||
      membershipsResult.error
    ) {
    return json(response, 500, { error: 'customer_records_unavailable' })
  }

  const appointments = appointmentsResult.data ?? []
  const appointmentIds = appointments.map((item) => item.id)
  const providerIds = [
    ...new Set(
      appointments.map((item) => item.provider_id).filter(Boolean),
    ),
  ]
  const [providersResult, paymentsResult] = await Promise.all([
    providerIds.length
      ? adminClient
          .from('staff_profiles')
          .select('id, display_name')
          .in('id', providerIds)
      : Promise.resolve({ data: [], error: null }),
    appointmentIds.length
      ? adminClient
          .from('appointment_payments')
          .select(
            'appointment_id, status, amount_cents, currency, card_brand, card_last_four, receipt_url, processed_at',
          )
          .in('appointment_id', appointmentIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ])

  if (providersResult.error || paymentsResult.error) {
    return json(response, 500, { error: 'customer_records_unavailable' })
  }

  const providerNames = new Map(
    (providersResult.data ?? []).map((item) => [
      item.id,
      item.display_name,
    ]),
  )
  const payments = new Map()
  for (const payment of paymentsResult.data ?? []) {
    if (!payments.has(payment.appointment_id)) {
      payments.set(payment.appointment_id, payment)
    }
  }

  return json(response, 200, {
    profile: {
        email: contactEmail,
      name: user.user_metadata?.full_name ?? '',
      phone: user.user_metadata?.phone ?? '',
    },
    appointments: appointments.map((appointment) => ({
      ...appointment,
      provider_name:
        providerNames.get(appointment.provider_id) ?? null,
      payment: payments.get(appointment.id) ?? null,
    })),
    giftCards: (giftCardsResult.data ?? []).map((card) => {
      const purchased = card.purchaser_user_id === user.id
      const received = card.recipient_user_id === user.id
      return {
        id: card.id,
        last_four: card.last_four,
        initial_balance_cents: card.initial_balance_cents,
        balance_cents: card.balance_cents,
        currency: card.currency,
        recipient_name: card.recipient_name,
        recipient_email: card.recipient_email,
        purchaser_name: card.purchaser_name,
        purchaser_email: card.purchaser_email,
        personal_message: card.personal_message,
        active: card.active,
        expires_at: card.expires_at,
        created_at: card.created_at,
        relationship:
          purchased && received
            ? 'both'
            : purchased
              ? 'purchased'
              : 'received',
      }
    }),
      memberships: membershipsResult.data ?? [],
  })
}

function squareSettings() {
  const environment =
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? 'production'
      : 'sandbox'

  return {
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    locationId:
      process.env.SQUARE_LOCATION_ID ??
      process.env.VITE_SQUARE_LOCATION_ID,
    environment,
    baseUrl:
      environment === 'production'
        ? 'https://connect.squareup.com'
        : 'https://connect.squareupsandbox.com',
  }
}

async function squareRequest(settings, path, body) {
  const squareResponse = await fetch(`${settings.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2025-07-16',
    },
    body: JSON.stringify(body),
  })
  const result = await squareResponse.json()

  if (!squareResponse.ok) {
    return {
      error:
        result.errors?.map((item) => item.detail || item.code).join('; ') ||
        'square_request_failed',
      status: squareResponse.status >= 400 ? squareResponse.status : 502,
    }
  }

  return { result }
}

async function createSquareCustomer({
  settings,
  customerId,
  customerName,
  customerEmail,
}) {
  const squareResult = await squareRequest(settings, '/v2/customers', {
    idempotency_key: `cust-${customerId}`,
    given_name: customerName,
    email_address: customerEmail,
    reference_id: customerId,
  })

  if (squareResult.error || !squareResult.result?.customer?.id) {
    return {
      error: squareResult.error || 'square_customer_create_failed',
      status: squareResult.status || 502,
    }
  }

  return { customerId: squareResult.result.customer.id }
}

async function saveSquareCard({
  settings,
  sourceId,
  idempotencyKey,
  squareCustomerId,
  customerId,
  customerName,
}) {
  const squareResult = await squareRequest(settings, '/v2/cards', {
    idempotency_key: idempotencyKey,
    source_id: sourceId,
    card: {
      cardholder_name: customerName,
      customer_id: squareCustomerId,
      reference_id: customerId,
    },
  })

  if (squareResult.error || !squareResult.result?.card?.id) {
    return {
      error: squareResult.error || 'square_card_save_failed',
      status: squareResult.status || 402,
    }
  }

  return { card: squareResult.result.card }
}

async function disableSquareCard(settings, cardId) {
  if (!cardId) return

  try {
    await fetch(`${settings.baseUrl}/v2/cards/${encodeURIComponent(cardId)}/disable`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2025-07-16',
      },
    })
  } catch {
    // Best-effort cleanup; the local payment method remains disabled.
  }
}

function requestIp(request) {
  const forwarded = request.headers['x-forwarded-for']
  return typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim().slice(0, 100)
    : null
}

async function prepareCardOnFile({
  adminClient,
  request,
  sourceId,
  idempotencyKey,
  customer,
  customerName,
  customerEmail,
}) {
  const settings = squareSettings()
  if (!settings.accessToken || !settings.locationId) {
    return { error: 'square_not_configured', status: 503 }
  }

  let squareCustomerId = customer.square_customer_id
  if (!squareCustomerId) {
    const customerResult = await createSquareCustomer({
      settings,
      customerId: customer.id,
      customerName,
      customerEmail,
    })
    if (customerResult.error) return customerResult

    squareCustomerId = customerResult.customerId
    const { error } = await adminClient
      .from('customers')
      .update({
        square_customer_id: squareCustomerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customer.id)

    if (error) {
      return { error: 'square_customer_link_failed', status: 500 }
    }
  }

  const cardResult = await saveSquareCard({
    settings,
    sourceId,
    idempotencyKey,
    squareCustomerId,
    customerId: customer.id,
    customerName,
  })
  if (cardResult.error) return cardResult

  const card = cardResult.card
  const methodValues = {
    customer_id: customer.id,
    square_customer_id: squareCustomerId,
    square_card_id: card.id,
    card_brand: card.card_brand ?? null,
    card_last_four: card.last_4 ?? null,
    exp_month: card.exp_month ?? null,
    exp_year: card.exp_year ?? null,
    status: card.enabled === false ? 'disabled' : 'active',
    environment: settings.environment,
    consent_version: paymentPolicyVersion,
    consent_text: paymentPolicyConsent,
    consent_at: new Date().toISOString(),
    consent_ip: requestIp(request),
    consent_user_agent:
      typeof request.headers['user-agent'] === 'string'
        ? request.headers['user-agent'].slice(0, 500)
        : null,
  }

  let { data: paymentMethod, error: methodError } = await adminClient
    .from('customer_payment_methods')
    .insert(methodValues)
    .select('*')
    .single()

  if (methodError?.code === '23505') {
    const existing = await adminClient
      .from('customer_payment_methods')
      .select('*')
      .eq('square_card_id', card.id)
      .single()
    paymentMethod = existing.data
    methodError = existing.error
  }

  if (methodError || !paymentMethod) {
    await disableSquareCard(settings, card.id)
    return { error: 'payment_method_save_failed', status: 500 }
  }

  return { paymentMethod, card, settings }
}

async function chargeMembership({
  settings,
  sourceId,
  idempotencyKey,
  customerName,
  customerEmail,
}) {
  if (!settings.accessToken || !settings.locationId) {
    return { error: 'square_not_configured', status: 503 }
  }

  const squareResponse = await fetch(`${settings.baseUrl}/v2/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': squareApiVersion,
    },
    body: JSON.stringify({
      source_id: sourceId,
      idempotency_key: idempotencyKey,
      location_id: settings.locationId,
      amount_money: { amount: 28800, currency: 'USD' },
      buyer_email_address: customerEmail,
      note: `ORA Annual Membership for ${customerName}`,
      autocomplete: true,
    }),
  })
  const result = await squareResponse.json()
  if (!squareResponse.ok || result.payment?.status !== 'COMPLETED') {
    return {
      error:
        result.errors?.map((item) => item.code).join(',') ||
        'membership_payment_failed',
      status: 502,
    }
  }

  return { payment: result.payment }
}

async function purchaseMembership(request, response) {
  const authenticated = await getAuthenticatedUser(request)
  if (authenticated.error) {
    return json(response, authenticated.status, {
      error: authenticated.error,
    })
  }

  const { adminClient, user, email: accountEmail } = authenticated
  const choice =
    request.body?.complimentaryServiceCode === 'pure-reset' ||
    request.body?.complimentaryServiceCode === 'vital-glow'
      ? request.body.complimentaryServiceCode
      : ''
  const name = String(
    request.body?.name ?? user.user_metadata?.full_name ?? '',
  ).trim()
  const phone = String(
    request.body?.phone ?? user.user_metadata?.phone ?? '',
  ).trim()
  const email = String(
    request.body?.email ??
      user.user_metadata?.contact_email ??
      accountEmail,
  )
    .trim()
    .toLowerCase()
  const sourceId = String(request.body?.sourceId ?? '').trim()
  const idempotencyKey = String(request.body?.idempotencyKey ?? '').trim()

  if (
    !choice ||
    !name ||
    !phonePattern.test(phone) ||
    !emailPattern.test(email) ||
    !sourceId ||
    !uuidPattern.test(idempotencyKey)
  ) {
    return json(response, 400, { error: 'invalid_membership_purchase' })
  }

  await adminClient
    .from('memberships')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('status', 'active')
    .lte('expires_at', new Date().toISOString())

  const { data: activeMembership, error: activeError } = await adminClient
    .from('memberships')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (activeError) {
    return json(response, 500, { error: 'membership_lookup_failed' })
  }
  if (activeMembership) {
    return json(response, 409, {
      error: 'active_membership_exists',
      membership: activeMembership,
    })
  }

  let { data: customer } = await adminClient
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!customer) {
    const byEmail = await adminClient
      .from('customers')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    customer = byEmail.data
  }

  if (customer) {
    const updated = await adminClient
      .from('customers')
      .update({
        auth_user_id: user.id,
        name,
        phone,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customer.id)
      .select('id')
      .single()
    customer = updated.data
  } else {
    const created = await adminClient
      .from('customers')
      .insert({ auth_user_id: user.id, name, phone, email })
      .select('id')
      .single()
    customer = created.data
  }

  if (!customer) {
    return json(response, 500, { error: 'customer_save_failed' })
  }

  const settings = squareSettings()
  const charged = await chargeMembership({
    settings,
    sourceId,
    idempotencyKey,
    customerName: name,
    customerEmail: email,
  })
  if (charged.error) {
    return json(response, charged.status, { error: charged.error })
  }

  const payment = charged.payment
  const existing = await adminClient
    .from('memberships')
    .select('*')
    .eq('provider_payment_id', payment.id)
    .maybeSingle()
  if (existing.data) {
    return json(response, 200, {
      membership: existing.data,
      idempotent: true,
    })
  }

  const { data: membership, error: membershipError } = await adminClient
    .from('memberships')
    .insert({
      customer_id: customer.id,
      user_id: user.id,
      complimentary_service_code: choice,
      provider_payment_id: payment.id,
      payment_environment: settings.environment,
      receipt_url: payment.receipt_url ?? null,
    })
    .select('*')
    .single()

  if (membershipError || !membership) {
    return json(response, 500, { error: 'membership_create_failed' })
  }

  await Promise.all([
    adminClient.from('membership_events').insert({
      membership_id: membership.id,
      event_type: 'purchased',
      details: {
        price_cents: 28800,
        complimentary_service_code: choice,
        provider_payment_id: payment.id,
      },
    }),
    adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: name,
        phone,
        contact_email: email,
      },
    }),
  ])

  return json(response, 201, {
    membership,
    receiptUrl: payment.receipt_url ?? null,
  })
}

export default async function handler(request, response) {
  if (request.method === 'GET' && request.query?.mine === '1') {
    response.setHeader('Cache-Control', 'private, no-store, max-age=0')
    return customerRecords(request, response)
  }

  if (request.method === 'POST' && request.query?.walkIn === '1') {
    return createWalkIn(request, response)
  }

  if (
    request.method === 'POST' &&
    request.body?.action === 'purchase_membership'
  ) {
    return purchaseMembership(request, response)
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const authenticated = await getAuthenticatedUser(request)
  if (authenticated.error) {
    return json(response, authenticated.status, {
      error: authenticated.error,
    })
  }

  const { adminClient, user, email: accountEmail } = authenticated
  const requestedName =
    typeof request.body?.name === 'string' ? request.body.name.trim() : ''
  const requestedPhone =
    typeof request.body?.phone === 'string' ? request.body.phone.trim() : ''
  const requestedEmail =
    typeof request.body?.email === 'string'
      ? request.body.email.trim().toLowerCase()
      : ''
  const registeredName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.trim()
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name.trim()
        : ''
  const registeredPhone =
    typeof user.user_metadata?.phone === 'string'
      ? user.user_metadata.phone.trim()
      : ''
  const registeredEmail =
    typeof user.user_metadata?.contact_email === 'string'
      ? user.user_metadata.contact_email.trim().toLowerCase()
      : accountEmail
  const name = requestedName || registeredName
  const phone = requestedPhone || registeredPhone
  const email = requestedEmail || registeredEmail
  const serviceId =
    typeof request.body?.serviceId === 'string'
      ? request.body.serviceId
      : ''
  const providerId =
    typeof request.body?.providerId === 'string'
      ? request.body.providerId
      : ''
  const startsAt =
    typeof request.body?.startsAt === 'string' ? request.body.startsAt : ''
  const locale =
    typeof request.body?.locale === 'string'
      ? request.body.locale.slice(0, 10)
      : 'en'
  const notes =
    typeof request.body?.notes === 'string'
      ? request.body.notes.trim().slice(0, 1000)
      : ''
  const sourceId =
    typeof request.body?.sourceId === 'string'
      ? request.body.sourceId.trim()
      : ''
  const idempotencyKey =
    typeof request.body?.idempotencyKey === 'string'
      ? request.body.idempotencyKey
      : ''
  const paymentPolicyAccepted =
    request.body?.paymentPolicyAccepted === true

  const requestedStart = new Date(startsAt)
  if (
    name.length < 1 ||
    name.length > 100 ||
    !phonePattern.test(phone) ||
    !emailPattern.test(email) ||
    !uuidPattern.test(serviceId) ||
    (providerId && !uuidPattern.test(providerId)) ||
    !sourceId ||
    !paymentPolicyAccepted ||
    !uuidPattern.test(idempotencyKey) ||
    Number.isNaN(requestedStart.getTime())
  ) {
    return json(response, 400, { error: 'invalid_input' })
  }

  const { error: profileUpdateError } =
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: name,
        phone,
        contact_email: email,
      },
    })
  if (profileUpdateError) {
    return json(response, 500, { error: 'customer_profile_update_failed' })
  }

  const [
    { data: settings, error: settingsError },
    { data: service, error: serviceError },
    { data: membership, error: membershipError },
  ] = await Promise.all([
    adminClient
      .from('business_settings')
      .select('timezone, location, cancellation_policy')
      .eq('id', true)
      .single(),
    adminClient
      .from('services')
      .select('id, code, name, duration_minutes, price_cents')
      .eq('id', serviceId)
      .eq('active', true)
      .eq('online_bookable', true)
      .single(),
    adminClient
      .from('memberships')
      .select(
        'id, status, complimentary_service_code, complimentary_redeemed_at, starts_at, expires_at',
      )
      .eq('user_id', user.id)
      .eq('status', 'active')
      .lte('starts_at', requestedStart.toISOString())
      .gt('expires_at', requestedStart.toISOString())
      .maybeSingle(),
  ])

  if (
    settingsError ||
    serviceError ||
    membershipError ||
    !settings ||
    !service
  ) {
    return json(response, 400, { error: 'service_unavailable' })
  }

  const requestedDate = dateInTimezone(requestedStart, settings.timezone)
  if (!Number.isInteger(service.price_cents) || service.price_cents <= 0) {
    return json(response, 400, { error: 'service_price_required' })
  }
  const servicePriceCents = membershipServicePrice(
    service,
    requestedStart,
    membership,
  )

  const appointmentFields =
    'id, customer_id, customer_user_id, customer_name, customer_email, phone, service, service_id, provider_id, starts_at, ends_at, status, service_price_cents, payment_method_id, card_brand, card_last_four, cancellation_deadline, payment_policy_version, payment_policy_consent_at'
  let appointment = null
  let customer = null
  let providerName = ''

  const { data: existingAppointment } = await adminClient
      .from('appointments')
      .select(appointmentFields)
      .eq('booking_idempotency_key', idempotencyKey)
      .maybeSingle()

  if (existingAppointment) {
      if (
        (existingAppointment.customer_user_id &&
          existingAppointment.customer_user_id !== user.id) ||
        existingAppointment.service_id !== serviceId ||
        new Date(existingAppointment.starts_at).getTime() !==
          requestedStart.getTime()
      ) {
        return json(response, 409, { error: 'idempotency_conflict' })
      }

      if (!existingAppointment.customer_user_id) {
        await adminClient
          .from('appointments')
          .update({ customer_user_id: user.id })
          .eq('id', existingAppointment.id)
        existingAppointment.customer_user_id = user.id
      }

      const [{ data: existingPaymentMethod }, { data: provider }] =
        await Promise.all([
          existingAppointment.payment_method_id
            ? adminClient
            .from('customer_payment_methods')
            .select('*')
            .eq('id', existingAppointment.payment_method_id)
            .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          adminClient
            .from('staff_profiles')
            .select('display_name')
            .eq('id', existingAppointment.provider_id)
            .single(),
        ])

      providerName = provider?.display_name ?? ''
      if (existingPaymentMethod?.status === 'active') {
        return json(response, 200, {
          appointment: {
            ...existingAppointment,
            provider_name: providerName,
            price_cents: existingAppointment.service_price_cents,
            location: settings.location,
            card_on_file: {
              card_brand: existingPaymentMethod.card_brand,
              card_last_four: existingPaymentMethod.card_last_four,
            },
          },
          notifications_queued: true,
        })
      }
      if (
        [
          'cancelled_or_changed_outside_24h',
          'cancelled_or_changed_within_24h',
          'no_show_no_contact',
        ].includes(existingAppointment.status)
      ) {
        return json(response, 402, { error: 'payment_failed' })
      }
      appointment = existingAppointment
  } else {
      const { data: availableSlots, error: availabilityError } =
        await adminClient.rpc('get_available_slots', {
          requested_date: requestedDate,
          requested_service: serviceId,
          requested_provider: providerId || null,
        })

      if (availabilityError) {
        return json(response, 500, { error: 'availability_unavailable' })
      }

      const matchingSlot = (availableSlots ?? []).find(
        (slot) =>
          new Date(slot.starts_at).getTime() === requestedStart.getTime() &&
          (!providerId || slot.provider_id === providerId),
      )

      if (!matchingSlot) {
        return json(response, 409, { error: 'slot_unavailable' })
      }
      providerName = matchingSlot.provider_name

      const { data: linkedCustomer } = await adminClient
        .from('customers')
        .select('id, square_customer_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      const { data: emailCustomer } = linkedCustomer
        ? { data: null }
        : await adminClient
        .from('customers')
        .select('id, square_customer_id')
        .eq('email', email)
        .order('created_at')
        .limit(1)
        .maybeSingle()

      if (linkedCustomer || emailCustomer) {
        const customerId = linkedCustomer?.id ?? emailCustomer.id
        const { data } = await adminClient
          .from('customers')
          .update({
            auth_user_id: user.id,
            name,
            phone,
            email,
            updated_at: new Date().toISOString(),
          })
          .eq('id', customerId)
          .select('id, square_customer_id')
          .single()
        customer = data
      } else {
        const { data, error } = await adminClient
          .from('customers')
          .insert({ auth_user_id: user.id, name, phone, email })
          .select('id, square_customer_id')
          .single()

        if (error || !data) {
          return json(response, 500, { error: 'customer_save_failed' })
        }
        customer = data
      }

      const appointmentResult = await adminClient
        .from('appointments')
        .insert({
          customer_id: customer.id,
          customer_user_id: user.id,
          customer_name: name,
          customer_email: email,
          phone,
          service: service.name,
          service_id: service.id,
          provider_id: matchingSlot.provider_id,
          preferred_date: requestedDate,
          starts_at: matchingSlot.starts_at,
          ends_at: matchingSlot.ends_at,
          message: notes || null,
          locale,
          status: 'pending',
          source: 'online',
          booking_idempotency_key: idempotencyKey,
          service_price_cents: servicePriceCents,
          cancellation_deadline: new Date(
            new Date(matchingSlot.starts_at).getTime() - 24 * 60 * 60 * 1000,
          ).toISOString(),
          payment_policy_version: paymentPolicyVersion,
          payment_policy_consent_at: new Date().toISOString(),
        })
        .select(appointmentFields)
        .single()

      if (appointmentResult.error || !appointmentResult.data) {
        const isConflict =
          appointmentResult.error?.code === '23P01' ||
          appointmentResult.error?.message?.includes(
            'appointments_provider_time_excl',
          )
        return json(response, isConflict ? 409 : 500, {
          error: isConflict ? 'slot_unavailable' : 'booking_failed',
        })
      }
      appointment = appointmentResult.data
    }

  if (!customer) {
    const customerResult = await adminClient
      .from('customers')
      .select('id, square_customer_id')
      .eq('id', appointment.customer_id)
      .single()
    customer = customerResult.data
  }
  if (!customer) {
    return json(response, 500, { error: 'customer_save_failed' })
  }

  const cardResult = await prepareCardOnFile({
      adminClient,
      request,
      sourceId,
      idempotencyKey,
      customer,
      customerName: name,
      customerEmail: email,
    })

  if (cardResult.error) {
      await adminClient
        .from('appointments')
        .delete()
        .eq('id', appointment.id)
      return json(response, cardResult.status, {
        error: 'payment_failed',
      })
    }

  const { error: confirmationError } = await adminClient
      .from('appointments')
      .update({
        payment_method_id: cardResult.paymentMethod.id,
        card_brand: cardResult.paymentMethod.card_brand,
        card_last_four: cardResult.paymentMethod.card_last_four,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointment.id)

  if (confirmationError) {
      await Promise.all([
        disableSquareCard(cardResult.settings, cardResult.card.id),
        adminClient
          .from('customer_payment_methods')
          .update({ status: 'disabled', updated_at: new Date().toISOString() })
          .eq('id', cardResult.paymentMethod.id),
        adminClient
          .from('appointments')
          .delete()
          .eq('id', appointment.id),
      ])
      return json(response, 500, {
        error: 'booking_confirmation_failed',
        ...(cardResult.settings.environment === 'sandbox'
          ? { confirmation_error: confirmationError.message }
          : {}),
      })
    }
  appointment.payment_method_id = cardResult.paymentMethod.id
  appointment.card_brand = cardResult.paymentMethod.card_brand
  appointment.card_last_four = cardResult.paymentMethod.card_last_four

  const notificationPayload = {
    customer_name: name,
    service: service.name,
    provider: providerName,
    starts_at: appointment.starts_at,
    ends_at: appointment.ends_at,
    location: settings.location,
    price_cents: servicePriceCents,
    card_on_file: {
      card_brand: cardResult.paymentMethod.card_brand,
      card_last_four: cardResult.paymentMethod.card_last_four,
    },
    cancellation_policy: settings.cancellation_policy,
    before_your_visit: [
      'Scalp sensitivity or wounds',
      'Pregnancy',
      'Allergies or sensitivities',
      'Mobility limitations',
      'Other conditions that may affect the service',
    ],
  }

  const { error: notificationError } = await adminClient
    .from('notification_queue')
    .insert([
      {
        appointment_id: appointment.id,
        channel: 'email',
        template: 'booking_confirmation',
        recipient: email,
        payload: notificationPayload,
      },
      {
        appointment_id: appointment.id,
        channel: 'sms',
        template: 'booking_confirmation',
        recipient: phone,
        payload: notificationPayload,
      },
    ])

  return json(response, 201, {
    appointment: {
      ...appointment,
      provider_name: providerName,
      price_cents: appointment.service_price_cents,
      location: settings.location,
      card_on_file: {
        card_brand: cardResult.paymentMethod.card_brand,
        card_last_four: cardResult.paymentMethod.card_last_four,
      },
    },
    notifications_queued: !notificationError,
  })
}
