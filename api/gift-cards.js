import {
  generateGiftCardCode,
  hashGiftCardCode,
  isGiftCardCode,
  normalizeGiftCardCode,
} from './_lib/gift-card.js'
import {
  getAuthenticatedStaff,
  getServerClient,
  json,
} from './_lib/supabase.js'

const managerRoles = ['owner', 'manager']

function optionalText(value, maxLength) {
  const text = String(value ?? '').trim()
  return text ? text.slice(0, maxLength) : null
}

function integer(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

async function publicBalance(request, response) {
  const code = normalizeGiftCardCode(request.query?.code)
  if (!isGiftCardCode(code)) {
    return json(response, 400, { error: 'invalid_gift_card_code' })
  }

  const adminClient = getServerClient()
  if (!adminClient) {
    return json(response, 500, { error: 'server_not_configured' })
  }

  const { data: card, error } = await adminClient
    .from('gift_cards')
    .select('last_four, balance_cents, currency, active, expires_at')
    .eq('code_hash', hashGiftCardCode(code))
    .maybeSingle()

  if (error) {
    return json(response, 500, { error: 'gift_card_lookup_failed' })
  }
  if (!card) {
    return json(response, 404, { error: 'gift_card_not_found' })
  }

  const expired =
    card.expires_at && new Date(card.expires_at).getTime() <= Date.now()

  return json(response, 200, {
    lastFour: card.last_four,
    balanceCents: card.balance_cents,
    currency: card.currency,
    status: !card.active ? 'inactive' : expired ? 'expired' : 'active',
    expiresAt: card.expires_at,
  })
}

async function listCards(request, response) {
  const authenticated = await getAuthenticatedStaff(request, managerRoles)
  if (authenticated.error) {
    return json(response, authenticated.status, {
      error: authenticated.error,
    })
  }

  const { data, error } = await authenticated.adminClient
    .from('gift_cards')
    .select(`
      *,
      gift_card_transactions (
        id,
        transaction_type,
        amount_cents,
        balance_after_cents,
        checkout_id,
        note,
        acted_by,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return json(response, 500, { error: 'gift_cards_load_failed' })
  }

  return json(response, 200, { cards: data ?? [] })
}

async function createCard(request, response) {
  const authenticated = await getAuthenticatedStaff(request, managerRoles)
  if (authenticated.error) {
    return json(response, authenticated.status, {
      error: authenticated.error,
    })
  }

  const amountCents = integer(request.body?.amountCents)
  if (!amountCents || amountCents < 100 || amountCents > 1000000) {
    return json(response, 400, { error: 'invalid_gift_card_amount' })
  }

  const expiresAt = request.body?.expiresAt
    ? new Date(request.body.expiresAt)
    : null
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return json(response, 400, { error: 'invalid_expiration' })
  }

  let code = ''
  let card = null
  let insertError = null

  for (let attempt = 0; attempt < 3 && !card; attempt += 1) {
    code = generateGiftCardCode()
    const result = await authenticated.adminClient
      .from('gift_cards')
      .insert({
        code_hash: hashGiftCardCode(code),
        last_four: normalizeGiftCardCode(code).slice(-4),
        initial_balance_cents: amountCents,
        balance_cents: amountCents,
        currency: 'USD',
        recipient_name: optionalText(request.body?.recipientName, 120),
        recipient_email: optionalText(request.body?.recipientEmail, 240),
        purchaser_name: optionalText(request.body?.purchaserName, 120),
        purchaser_email: optionalText(request.body?.purchaserEmail, 240),
        personal_message: optionalText(request.body?.personalMessage, 500),
        purchase_method: 'manual',
        note: optionalText(request.body?.note, 500),
        expires_at: expiresAt?.toISOString() ?? null,
        issued_by: authenticated.profile.id,
      })
      .select('*')
      .single()

    card = result.data
    insertError = result.error
  }

  if (!card || insertError) {
    return json(response, 500, { error: 'gift_card_create_failed' })
  }

  const { error: transactionError } = await authenticated.adminClient
    .from('gift_card_transactions')
    .insert({
      gift_card_id: card.id,
      transaction_type: 'issued',
      amount_cents: amountCents,
      balance_after_cents: amountCents,
      note: optionalText(request.body?.note, 500),
      acted_by: authenticated.profile.id,
    })

  if (transactionError) {
    await authenticated.adminClient
      .from('gift_cards')
      .delete()
      .eq('id', card.id)
    return json(response, 500, { error: 'gift_card_create_failed' })
  }

  return json(response, 201, { card, code })
}

async function updateCard(request, response) {
  const authenticated = await getAuthenticatedStaff(request, managerRoles)
  if (authenticated.error) {
    return json(response, authenticated.status, {
      error: authenticated.error,
    })
  }

  const cardId = String(request.body?.cardId ?? '')
  const action = request.body?.action
  if (!cardId) {
    return json(response, 400, { error: 'gift_card_not_found' })
  }

  if (action === 'status') {
    const { data, error } = await authenticated.adminClient
      .from('gift_cards')
      .update({
        active: Boolean(request.body?.active),
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select('*')
      .single()

    if (error || !data) {
      return json(response, 404, { error: 'gift_card_not_found' })
    }
    return json(response, 200, { card: data })
  }

  if (action === 'adjust') {
    const amountCents = integer(request.body?.amountCents)
    if (!amountCents || Math.abs(amountCents) > 1000000) {
      return json(response, 400, { error: 'invalid_gift_card_amount' })
    }

    const { data, error } = await authenticated.adminClient.rpc(
      'adjust_gift_card',
      {
        p_gift_card_id: cardId,
        p_amount_cents: amountCents,
        p_note: optionalText(request.body?.note, 500),
        p_acted_by: authenticated.profile.id,
      },
    )

    if (error) {
      return json(response, 500, { error: 'gift_card_adjust_failed' })
    }
    if (data?.error) {
      return json(response, 409, data)
    }
    return json(response, 200, data)
  }

  return json(response, 400, { error: 'unsupported_action' })
}

export default async function handler(request, response) {
  if (request.method === 'GET' && request.query?.code) {
    return publicBalance(request, response)
  }
  if (request.method === 'GET') {
    return listCards(request, response)
  }
  if (request.method === 'POST') {
    return createCard(request, response)
  }
  if (request.method === 'PATCH') {
    return updateCard(request, response)
  }

  response.setHeader('Allow', 'GET, POST, PATCH')
  return json(response, 405, { error: 'method_not_allowed' })
}
