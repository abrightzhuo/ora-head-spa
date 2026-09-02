import { randomUUID } from 'node:crypto'
import { getAuthenticatedStaff, json } from './_lib/supabase.js'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const feeRules = {
  cancellation_outside_24h: {
    requiredStatus: 'cancelled_or_changed_outside_24h',
    percentageBps: 0,
    description: 'no-fee cancellation or change with more than 24 hours notice',
  },
  late_cancellation: {
    requiredStatus: 'cancelled_or_changed_within_24h',
    percentageBps: 1500,
    description: '15% late cancellation fee',
  },
  no_show: {
    requiredStatus: 'no_show_no_contact',
    percentageBps: 5000,
    description: '50% no-show fee',
  },
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

async function chargeCardOnFile({
  cardId,
  customerId,
  appointment,
  amountCents,
  idempotencyKey,
  description,
}) {
  const settings = squareSettings()
  if (!settings.accessToken || !settings.locationId) {
    return { error: 'square_not_configured', status: 503 }
  }

  const squareResponse = await fetch(`${settings.baseUrl}/v2/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2025-07-16',
    },
    body: JSON.stringify({
      source_id: cardId,
      customer_id: customerId,
      idempotency_key: idempotencyKey,
      location_id: settings.locationId,
      amount_money: {
        amount: amountCents,
        currency: 'USD',
      },
      autocomplete: true,
      reference_id: appointment.id,
      buyer_email_address: appointment.customer_email,
      note: `ORA ${description} - ${appointment.customer_name}`.slice(0, 500),
    }),
  })
  const result = await squareResponse.json()

  if (!squareResponse.ok || !result.payment) {
    return {
      error:
        result.errors?.map((item) => item.detail || item.code).join('; ') ||
        'square_payment_failed',
      status: squareResponse.status >= 400 ? squareResponse.status : 402,
    }
  }

  return {
    payment: result.payment,
    environment: settings.environment,
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const authenticated = await getAuthenticatedStaff(request, [
    'owner',
    'manager',
    'front_desk',
  ])
  if (authenticated.error) {
    return json(response, authenticated.status, {
      error: authenticated.error,
    })
  }

  const appointmentId =
    typeof request.body?.appointmentId === 'string'
      ? request.body.appointmentId
      : ''
  const chargeType = request.body?.chargeType
  const rule = feeRules[chargeType]

  if (!uuidPattern.test(appointmentId) || !rule) {
    return json(response, 400, { error: 'invalid_input' })
  }

  const { adminClient, profile } = authenticated
  const { data: appointment, error: appointmentError } = await adminClient
    .from('appointments')
    .select(
      'id, customer_name, customer_email, starts_at, status, service_price_cents, payment_method_id',
    )
    .eq('id', appointmentId)
    .single()

  if (appointmentError || !appointment) {
    return json(response, 404, { error: 'appointment_not_found' })
  }
  if (appointment.status !== rule.requiredStatus) {
    return json(response, 409, { error: 'appointment_status_not_eligible' })
  }
  if (
    !appointment.starts_at ||
    !Number.isInteger(appointment.service_price_cents) ||
    appointment.service_price_cents <= 0 ||
    !appointment.payment_method_id
  ) {
    return json(response, 409, { error: 'card_on_file_unavailable' })
  }

  const { data: paymentMethod, error: methodError } = await adminClient
    .from('customer_payment_methods')
    .select(
      'id, square_customer_id, square_card_id, card_brand, card_last_four, status, environment',
    )
    .eq('id', appointment.payment_method_id)
    .single()

  const settings = squareSettings()
  if (
    methodError ||
    !paymentMethod ||
    paymentMethod.status !== 'active' ||
    paymentMethod.environment !== settings.environment
  ) {
    return json(response, 409, { error: 'card_on_file_unavailable' })
  }

  const amountCents = Math.round(
    (appointment.service_price_cents * rule.percentageBps) / 10000,
  )
  let { data: charge } = await adminClient
    .from('appointment_charges')
    .select('*')
    .eq('appointment_id', appointment.id)
    .eq('charge_type', chargeType)
    .maybeSingle()

  if (charge?.status === 'completed' || charge?.status === 'waived') {
    return json(response, 200, { charge, idempotent: true })
  }

  if (!charge) {
    const result = await adminClient
      .from('appointment_charges')
      .insert({
        appointment_id: appointment.id,
        payment_method_id: paymentMethod.id,
        charge_type: chargeType,
        percentage_bps: rule.percentageBps,
        base_amount_cents: appointment.service_price_cents,
        amount_cents: amountCents,
        idempotency_key: randomUUID(),
        status: rule.percentageBps === 0 ? 'waived' : 'pending',
        card_brand: paymentMethod.card_brand,
        card_last_four: paymentMethod.card_last_four,
        charged_by: profile.id,
      })
      .select('*')
      .single()

    if (result.error?.code === '23505') {
      const existing = await adminClient
        .from('appointment_charges')
        .select('*')
        .eq('appointment_id', appointment.id)
        .eq('charge_type', chargeType)
        .single()
      charge = existing.data
    } else if (result.error || !result.data) {
      return json(response, 500, { error: 'charge_record_failed' })
    } else {
      charge = result.data
    }
  } else if (charge.status === 'failed') {
    const retried = await adminClient
      .from('appointment_charges')
      .update({
        idempotency_key: randomUUID(),
        status: 'pending',
        failure_message: null,
        charged_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', charge.id)
      .select('*')
      .single()

    if (retried.error || !retried.data) {
      return json(response, 500, { error: 'charge_record_failed' })
    }
    charge = retried.data
  }

  if (!charge) {
    return json(response, 500, { error: 'charge_record_failed' })
  }

  if (rule.percentageBps === 0) {
    return json(response, 201, { charge })
  }

  const squareResult = await chargeCardOnFile({
    cardId: paymentMethod.square_card_id,
    customerId: paymentMethod.square_customer_id,
    appointment,
    amountCents,
    idempotencyKey: charge.idempotency_key,
    description: rule.description,
  })

  if (squareResult.error) {
    await adminClient
      .from('appointment_charges')
      .update({
        status: 'failed',
        failure_message: squareResult.error.slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq('id', charge.id)

    return json(response, squareResult.status, {
      error: 'card_on_file_charge_failed',
      detail: squareResult.error,
    })
  }

  const payment = squareResult.payment
  const status = payment.status === 'COMPLETED' ? 'completed' : 'pending'
  const { data: savedCharge, error: saveError } = await adminClient
    .from('appointment_charges')
    .update({
      provider_payment_id: payment.id,
      status,
      card_brand:
        payment.card_details?.card?.card_brand ?? paymentMethod.card_brand,
      card_last_four:
        payment.card_details?.card?.last_4 ?? paymentMethod.card_last_four,
      receipt_url: payment.receipt_url ?? null,
      failure_message: null,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', charge.id)
    .select('*')
    .single()

  if (saveError || !savedCharge) {
    return json(response, 500, { error: 'charge_record_failed' })
  }

  return json(response, status === 'completed' ? 201 : 202, {
    charge: savedCharge,
    environment: squareResult.environment,
  })
}
