import { randomUUID } from 'node:crypto'
import {
  generateGiftCardCode,
  hashGiftCardCode,
  normalizeGiftCardCode,
} from './_lib/gift-card.js'
import { sendGiftCardEmails } from './_lib/resend.js'
import { getAuthenticatedUser, json } from './_lib/supabase.js'

const supportedLocales = new Set([
  'zh',
  'zh-TW',
  'en',
  'es',
  'fr',
  'ja',
  'ko',
  'de',
  'ru',
])

function optionalText(value, maxLength) {
  const text = String(value ?? '').trim()
  return text ? text.slice(0, maxLength) : null
}

function validEmail(value) {
  const email = optionalText(value, 240)
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email
    : null
}

async function chargeSquare({
  sourceId,
  amountCents,
  idempotencyKey,
  purchaserEmail,
  recipientName,
}) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const locationId =
    process.env.SQUARE_LOCATION_ID ?? process.env.VITE_SQUARE_LOCATION_ID
  const environment = process.env.SQUARE_ENVIRONMENT ?? 'sandbox'

  if (!accessToken || !locationId) {
    return { error: 'square_not_configured' }
  }

  const baseUrl =
    environment === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com'

  const squareResponse = await fetch(`${baseUrl}/v2/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2025-04-16',
    },
    body: JSON.stringify({
      source_id: sourceId,
      idempotency_key: idempotencyKey,
      location_id: locationId,
      amount_money: {
        amount: amountCents,
        currency: 'USD',
      },
      buyer_email_address: purchaserEmail,
      note: `ORA Gift Card${recipientName ? ` for ${recipientName}` : ''}`,
      autocomplete: true,
    }),
  })

  const result = await squareResponse.json()
  if (!squareResponse.ok || !result.payment) {
    return {
      error:
        result.errors?.map((item) => item.code).join(',') ||
        'square_payment_failed',
    }
  }
  if (result.payment.status !== 'COMPLETED') {
    return { error: 'square_payment_pending' }
  }

  return { payment: result.payment, environment }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const authenticated = await getAuthenticatedUser(request)
  if (authenticated.error) {
    return json(response, authenticated.status, {
      error: authenticated.error,
    })
  }

  const { adminClient, user, email: purchaserEmail } = authenticated
  const amountCents = Number(request.body?.amountCents)
  const purchaserName = optionalText(request.body?.purchaserName, 120)
  const recipientName = optionalText(request.body?.recipientName, 120)
  const recipientEmail = validEmail(request.body?.recipientEmail)?.toLowerCase()
  const personalMessage = optionalText(request.body?.personalMessage, 500)
  const sourceId = optionalText(request.body?.sourceId, 500)
  const requestedLocale = optionalText(request.body?.locale, 10)
  const locale = supportedLocales.has(requestedLocale)
    ? requestedLocale
    : 'en'
  const idempotencyKey =
    optionalText(request.body?.idempotencyKey, 80) ?? randomUUID()

  if (
    !Number.isInteger(amountCents) ||
    amountCents < 2500 ||
    amountCents > 100000 ||
    !purchaserName ||
    !purchaserEmail ||
    !recipientName ||
    !recipientEmail ||
    !sourceId
  ) {
    return json(response, 400, { error: 'invalid_purchase_details' })
  }

  const squareResult = await chargeSquare({
    sourceId,
    amountCents,
    idempotencyKey,
    purchaserEmail,
    recipientName,
  })
  if (squareResult.error) {
    return json(response, 502, { error: squareResult.error })
  }

  const payment = squareResult.payment
  const existing = await adminClient
    .from('gift_cards')
    .select('id')
    .eq('provider_payment_id', payment.id)
    .maybeSingle()

  if (existing.data) {
    return json(response, 409, { error: 'purchase_already_completed' })
  }

  let code = ''
  let card = null
  let insertError = null

  for (let attempt = 0; attempt < 3 && !card; attempt += 1) {
    code = generateGiftCardCode()
    const result = await adminClient
      .from('gift_cards')
      .insert({
        code_hash: hashGiftCardCode(code),
        last_four: normalizeGiftCardCode(code).slice(-4),
        initial_balance_cents: amountCents,
        balance_cents: amountCents,
        currency: 'USD',
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        recipient_user_id:
          recipientEmail === purchaserEmail ? user.id : null,
        purchaser_name: purchaserName,
        purchaser_email: purchaserEmail,
        purchaser_user_id: user.id,
        personal_message: personalMessage,
        purchase_method: 'square',
        provider_payment_id: payment.id,
        active: squareResult.environment === 'production',
        issued_by: null,
      })
      .select('*')
      .single()

    card = result.data
    insertError = result.error
  }

  if (!card || insertError) {
    return json(response, 500, { error: 'gift_card_create_failed' })
  }

  const { error: transactionError } = await adminClient
    .from('gift_card_transactions')
    .insert({
      gift_card_id: card.id,
      transaction_type: 'issued',
      amount_cents: amountCents,
      balance_after_cents: amountCents,
      note:
        squareResult.environment === 'production'
          ? 'Online gift card purchase'
          : 'Square Sandbox test purchase',
      acted_by: null,
    })

  if (transactionError) {
    return json(response, 500, { error: 'gift_card_create_failed' })
  }

  const emailDelivery = await sendGiftCardEmails({
    cardId: card.id,
    locale,
    environment: squareResult.environment,
    code,
    amountCents,
    purchaserName,
    purchaserEmail,
    recipientName,
    recipientEmail,
    personalMessage,
    receiptUrl: payment.receipt_url ?? null,
  })

  console.info('Gift card email delivery', {
    cardId: card.id,
    recipient: emailDelivery.recipient.status,
    purchaser: emailDelivery.purchaser.status,
  })

  return json(response, 201, {
    code,
    amountCents,
    currency: 'USD',
    recipientName,
    recipientEmail,
    personalMessage,
    receiptUrl: payment.receipt_url ?? null,
    emailDelivery: {
      recipient: emailDelivery.recipient.status,
      purchaser: emailDelivery.purchaser.status,
    },
  })
}
