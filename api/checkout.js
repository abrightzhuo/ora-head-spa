import { randomUUID } from 'node:crypto'
import {
  hashGiftCardCode,
  isGiftCardCode,
} from './_lib/gift-card.js'
import {
  getAuthenticatedStaff,
  json,
} from './_lib/supabase.js'

const appointmentRoles = ['owner', 'manager', 'front_desk', 'staff']
const paymentMethods = [
  'card_on_file',
  'square_card',
  'cash',
  'external_card',
  'gift_card',
  'other',
]
const manualPaymentRoles = ['owner', 'manager', 'front_desk']

function integer(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

function calculateCheckout(
  items,
  manualDiscountCents,
  tipCents,
  taxRateBps,
  membershipBenefit = null,
) {
  let complimentaryAvailable =
    Boolean(membershipBenefit?.complimentaryAvailable)
  const normalized = items.map((item, index) => {
    const quantity = Math.max(1, integer(item.quantity, 1))
    const unitPriceCents = Math.max(0, integer(item.unit_price_cents))
    const lineSubtotalCents = quantity * unitPriceCents
    const complimentaryApplied =
      complimentaryAvailable &&
      item.item_type === 'service' &&
      item.service_id === membershipBenefit?.complimentaryServiceId
    const complimentaryDiscount = complimentaryApplied ? unitPriceCents : 0
    if (complimentaryApplied) complimentaryAvailable = false
    const percentageBps =
      item.item_type === 'product'
        ? membershipBenefit?.productDiscountBps ?? 0
        : ['service', 'add_on'].includes(item.item_type)
          ? membershipBenefit?.serviceDiscountBps ?? 0
          : 0
    const membershipDiscountCents = Math.min(
      lineSubtotalCents,
      complimentaryDiscount +
        Math.round(
          Math.max(0, lineSubtotalCents - complimentaryDiscount) *
            percentageBps /
            10000,
        ),
    )

    return {
      item_type: item.item_type,
      service_id: item.service_id || null,
      product_id: item.product_id || null,
      provider_id: item.provider_id || null,
      description: String(item.description ?? '').trim().slice(0, 240),
      quantity,
      unit_price_cents: unitPriceCents,
      line_subtotal_cents: lineSubtotalCents,
      membership_discount_cents: membershipDiscountCents,
      membership_complimentary_applied: complimentaryApplied,
      taxable: Boolean(item.taxable),
      commissionable: Boolean(item.commissionable),
      display_order: index,
    }
  })

  const subtotalCents = normalized.reduce(
    (sum, item) => sum + item.line_subtotal_cents,
    0,
  )
  const membershipDiscountCents = normalized.reduce(
    (sum, item) => sum + item.membership_discount_cents,
    0,
  )
  const remainingAfterMembership = subtotalCents - membershipDiscountCents
  const appliedManualDiscount = Math.min(
    remainingAfterMembership,
    Math.max(0, integer(manualDiscountCents)),
  )

  let remainingManualDiscount = appliedManualDiscount
  normalized.forEach((item, index) => {
    const lineBaseAfterMembership =
      item.line_subtotal_cents - item.membership_discount_cents
    const manualLineDiscount =
      index === normalized.length - 1
        ? remainingManualDiscount
        : Math.min(
            remainingManualDiscount,
            Math.round(
              appliedManualDiscount *
                (lineBaseAfterMembership /
                  Math.max(remainingAfterMembership, 1)),
            ),
          )
    item.discount_cents =
      item.membership_discount_cents + manualLineDiscount
    remainingManualDiscount -= manualLineDiscount
    const taxableBase = item.taxable
      ? item.line_subtotal_cents - item.discount_cents
      : 0
    item.tax_cents = Math.round(taxableBase * taxRateBps / 10000)
    item.line_total_cents =
      item.line_subtotal_cents - item.discount_cents + item.tax_cents
    item.commission_base_cents = item.commissionable
      ? item.line_subtotal_cents - item.discount_cents
      : 0
  })

  const taxCents = normalized.reduce((sum, item) => sum + item.tax_cents, 0)
  const appliedTip = Math.max(0, integer(tipCents))

  return {
    items: normalized,
    subtotal_cents: subtotalCents,
    discount_cents: membershipDiscountCents + appliedManualDiscount,
    membership_discount_cents: membershipDiscountCents,
    membership_complimentary_applied: normalized.some(
      (item) => item.membership_complimentary_applied,
    ),
    tax_cents: taxCents,
    tip_cents: appliedTip,
    total_cents:
      subtotalCents -
      membershipDiscountCents -
      appliedManualDiscount +
      taxCents +
      appliedTip,
  }
}

function membershipBenefit(appointment, membership, services) {
  const serviceTime = new Date(appointment.starts_at).getTime()
  if (
    !membership ||
    membership.status !== 'active' ||
    new Date(membership.starts_at).getTime() > serviceTime ||
    new Date(membership.expires_at).getTime() <= serviceTime
  ) {
    return null
  }

  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  }).format(new Date(appointment.starts_at))
  const weekdayPrivilege = ['Mon', 'Tue', 'Wed', 'Thu'].includes(weekday)
  const complimentaryService = services.find(
    (service) => service.code === membership.complimentary_service_code,
  )

  return {
    membershipId: membership.id,
    expiresAt: membership.expires_at,
    serviceDiscountBps: weekdayPrivilege ? 2000 : 1000,
    productDiscountBps: 2000,
    complimentaryServiceCode: membership.complimentary_service_code,
    complimentaryServiceId: complimentaryService?.id ?? null,
    complimentaryAvailable: !membership.complimentary_redeemed_at,
  }
}

async function loadCheckout(adminClient, appointmentId) {
  const { data: appointment, error: appointmentError } = await adminClient
    .from('appointments')
    .select(
      'id, customer_id, customer_name, customer_email, phone, service, service_id, provider_id, starts_at, ends_at, status, payment_method_id',
    )
    .eq('id', appointmentId)
    .single()

  if (appointmentError || !appointment) {
    return { error: 'appointment_not_found', status: 404 }
  }

  const { data: checkout } = await adminClient
    .from('checkouts')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

    const [
      itemsResult,
      paymentsResult,
      tipsResult,
      productsResult,
      servicesResult,
      membershipResult,
      settingsResult,
      appointmentPaymentResult,
      savedPaymentMethodResult,
    ] =
    await Promise.all([
      checkout
        ? adminClient
            .from('checkout_items')
            .select('*')
            .eq('checkout_id', checkout.id)
            .order('display_order')
        : Promise.resolve({ data: [], error: null }),
      checkout
        ? adminClient
            .from('payments')
            .select('*')
            .eq('checkout_id', checkout.id)
            .order('created_at')
        : Promise.resolve({ data: [], error: null }),
      checkout
        ? adminClient
            .from('tip_allocations')
            .select('*')
            .eq('checkout_id', checkout.id)
        : Promise.resolve({ data: [], error: null }),
      adminClient
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name'),
        adminClient
          .from('services')
          .select(
            'id, code, name, price_cents, taxable, commissionable, active',
          )
          .eq('active', true),
        appointment.customer_id
          ? adminClient
              .from('memberships')
              .select('*')
              .eq('customer_id', appointment.customer_id)
              .eq('status', 'active')
              .lte('starts_at', appointment.starts_at)
              .gt('expires_at', appointment.starts_at)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      adminClient
        .from('business_settings')
        .select('tax_rate_bps')
        .eq('id', true)
        .single(),
      adminClient
        .from('appointment_payments')
        .select('*')
        .eq('appointment_id', appointmentId)
        .maybeSingle(),
      appointment.payment_method_id
        ? adminClient
            .from('customer_payment_methods')
            .select(
              'id, square_customer_id, square_card_id, card_brand, card_last_four, status, environment',
            )
            .eq('id', appointment.payment_method_id)
            .eq('status', 'active')
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

  const membership = membershipResult.data ?? null

  return {
    appointment,
    checkout: checkout ?? null,
    items: itemsResult.data ?? [],
    payments: paymentsResult.data ?? [],
    tips: tipsResult.data ?? [],
    products: productsResult.data ?? [],
    services: servicesResult.data ?? [],
    membership,
    membershipBenefit: membershipBenefit(
      appointment,
      membership,
      servicesResult.data ?? [],
    ),
    taxRateBps: settingsResult.data?.tax_rate_bps ?? 0,
    appointmentPayment: appointmentPaymentResult.data ?? null,
    savedPaymentMethod: savedPaymentMethodResult.data ?? null,
  }
}

async function canAccessAppointment(profile, appointment) {
  return (
    ['owner', 'manager', 'front_desk'].includes(profile.role) ||
    appointment.provider_id === profile.id
  )
}

async function processSquarePayment({
  sourceId,
  amountCents,
  tipCents,
  idempotencyKey,
  checkoutId,
  customerName,
  customerId,
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
  const response = await fetch(`${baseUrl}/v2/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2025-07-16',
    },
    body: JSON.stringify({
      source_id: sourceId,
      idempotency_key: idempotencyKey,
      location_id: locationId,
      amount_money: {
        amount: amountCents,
        currency: 'USD',
      },
      tip_money:
        tipCents > 0
          ? {
              amount: tipCents,
              currency: 'USD',
            }
          : undefined,
      reference_id: checkoutId,
      note: `ORA checkout for ${customerName}`,
      customer_id: customerId || undefined,
      autocomplete: true,
    }),
  })
  const result = await response.json()

  if (!response.ok || !result.payment) {
    return {
      error:
        result.errors?.map((item) => item.detail).join('; ') ||
        'square_payment_failed',
    }
  }

  return { payment: result.payment }
}

export default async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const auth = await getAuthenticatedStaff(request, appointmentRoles)
  if (auth.error) {
    return json(response, auth.status, { error: auth.error })
  }
  const { adminClient, profile } = auth
  const appointmentId =
    request.method === 'GET'
      ? String(request.query.appointmentId ?? '')
      : String(request.body?.appointmentId ?? '')

  if (!appointmentId) {
    return json(response, 400, { error: 'invalid_input' })
  }

  const loaded = await loadCheckout(adminClient, appointmentId)
  if (loaded.error) {
    return json(response, loaded.status, { error: loaded.error })
  }
  if (!(await canAccessAppointment(profile, loaded.appointment))) {
    return json(response, 403, { error: 'forbidden' })
  }

  if (request.method === 'GET') {
    return json(response, 200, loaded)
  }

  const action = request.body?.action
  if (action === 'open') {
    if (loaded.checkout) return json(response, 200, loaded)

    const { data: service, error: serviceError } = await adminClient
      .from('services')
      .select(
        'id, name, price_cents, taxable, commissionable',
      )
      .eq('id', loaded.appointment.service_id)
      .single()

    if (serviceError || !service || service.price_cents === null) {
      return json(response, 409, { error: 'service_price_required' })
    }

    const { data: checkout, error: checkoutError } = await adminClient
      .from('checkouts')
      .insert({
        appointment_id: appointmentId,
        customer_id: loaded.appointment.customer_id,
        provider_id: loaded.appointment.provider_id,
          membership_id: loaded.membershipBenefit?.membershipId ?? null,
        opened_by: profile.id,
        updated_by: profile.id,
      })
      .select('*')
      .single()

    if (checkoutError || !checkout) {
      return json(response, 500, { error: 'checkout_open_failed' })
    }

    const calculated = calculateCheckout(
      [
        {
          item_type: 'service',
          service_id: service.id,
          provider_id: loaded.appointment.provider_id,
          description: service.name,
          quantity: 1,
          unit_price_cents: service.price_cents,
          taxable: service.taxable,
          commissionable: service.commissionable,
        },
      ],
      0,
      0,
      0,
        loaded.membershipBenefit,
    )
      const { items: calculatedItems, ...openingTotals } = calculated

    const { error: itemError } = await adminClient
      .from('checkout_items')
      .insert(
          calculatedItems.map((item) => ({
          ...item,
          checkout_id: checkout.id,
        })),
      )

    if (itemError) {
      await adminClient.from('checkouts').delete().eq('id', checkout.id)
      return json(response, 500, { error: 'checkout_open_failed' })
    }

      await adminClient
        .from('checkouts')
        .update(openingTotals)
        .eq('id', checkout.id)

    if (loaded.appointmentPayment?.status === 'completed') {
      const { error: prepaymentError } = await adminClient
        .from('payments')
        .insert({
          checkout_id: checkout.id,
          method: 'square_card',
          provider: 'square',
          provider_payment_id:
            loaded.appointmentPayment.provider_payment_id,
          idempotency_key: loaded.appointmentPayment.idempotency_key,
          status: 'completed',
          amount_cents: loaded.appointmentPayment.amount_cents,
          card_brand: loaded.appointmentPayment.card_brand,
          card_last_four: loaded.appointmentPayment.card_last_four,
          receipt_url: loaded.appointmentPayment.receipt_url,
          processed_at: loaded.appointmentPayment.processed_at,
          created_by: profile.id,
        })

      if (prepaymentError) {
        await adminClient
          .from('checkout_items')
          .delete()
          .eq('checkout_id', checkout.id)
        await adminClient.from('checkouts').delete().eq('id', checkout.id)
        return json(response, 500, { error: 'prepayment_import_failed' })
      }
    }

    await adminClient.from('checkout_history').insert({
      checkout_id: checkout.id,
      action: 'opened',
      details: {
        appointment_id: appointmentId,
        prepaid_cents:
          loaded.appointmentPayment?.status === 'completed'
            ? loaded.appointmentPayment.amount_cents
            : 0,
      },
      acted_by: profile.id,
    })

    return json(
      response,
      201,
      await loadCheckout(adminClient, appointmentId),
    )
  }

  if (!loaded.checkout || loaded.checkout.status !== 'draft') {
    return json(response, 409, { error: 'checkout_not_editable' })
  }

  const { data: settings, error: settingsError } = await adminClient
    .from('business_settings')
    .select('tax_rate_bps, currency')
    .eq('id', true)
    .single()

  if (settingsError || !settings) {
    return json(response, 500, { error: 'settings_unavailable' })
  }

  const inputItems = Array.isArray(request.body?.items)
    ? request.body.items
    : loaded.items
  const calculated = calculateCheckout(
    inputItems,
    request.body?.discountCents,
    request.body?.tipCents,
    settings.tax_rate_bps,
      loaded.membershipBenefit,
  )

  if (
    calculated.items.length === 0 ||
    calculated.items.some(
      (item) =>
        !item.description ||
        !['service', 'add_on', 'product', 'custom'].includes(
          item.item_type,
        ),
    )
  ) {
    return json(response, 400, { error: 'invalid_items' })
  }

  if (action === 'save') {
    const { items: calculatedItems, ...checkoutTotals } = calculated
    await adminClient
      .from('checkout_items')
      .delete()
      .eq('checkout_id', loaded.checkout.id)
    const { error: itemError } = await adminClient
      .from('checkout_items')
      .insert(
        calculatedItems.map((item) => ({
          ...item,
          checkout_id: loaded.checkout.id,
        })),
      )
    const { error: checkoutError } = await adminClient
      .from('checkouts')
      .update({
        ...checkoutTotals,
        membership_id: loaded.membershipBenefit?.membershipId ?? null,
        currency: settings.currency,
        updated_at: new Date().toISOString(),
        updated_by: profile.id,
      })
      .eq('id', loaded.checkout.id)

    if (itemError || checkoutError) {
      return json(response, 500, { error: 'checkout_save_failed' })
    }

    await adminClient.from('checkout_history').insert({
      checkout_id: loaded.checkout.id,
      action: 'saved',
      details: calculated,
      acted_by: profile.id,
    })
    return json(
      response,
      200,
      await loadCheckout(adminClient, appointmentId),
    )
  }

  if (action !== 'complete') {
    return json(response, 400, { error: 'unsupported_action' })
  }

    const completedPayments = loaded.payments.filter(
      (payment) => payment.status === 'completed',
    )
    const alreadyPaidCents = completedPayments.reduce(
      (sum, payment) => sum + payment.amount_cents,
      0,
    )
    const amountDueCents = Math.max(
      0,
      calculated.total_cents - alreadyPaidCents,
    )
    const method = request.body?.paymentMethod
    if (amountDueCents > 0 && !paymentMethods.includes(method)) {
      return json(response, 400, { error: 'invalid_payment_method' })
    }
    if (
      amountDueCents > 0 &&
      !['square_card', 'card_on_file'].includes(method) &&
      !manualPaymentRoles.includes(profile.role)
    ) {
      return json(response, 403, { error: 'manual_payment_forbidden' })
    }

  const primaryProviderId =
    calculated.items.find(
      (item) =>
        ['service', 'add_on'].includes(item.item_type) && item.provider_id,
    )?.provider_id ?? loaded.appointment.provider_id
    let payment = completedPayments.at(-1) ?? null
    let giftCardRedemption = null

  await adminClient
    .from('checkout_items')
    .delete()
    .eq('checkout_id', loaded.checkout.id)
  const { error: itemError } = await adminClient
    .from('checkout_items')
    .insert(
      calculated.items.map((item) => ({
        ...item,
        checkout_id: loaded.checkout.id,
      })),
    )

    if (itemError) {
    return json(response, 500, { error: 'payment_record_failed' })
  }

    if (amountDueCents > 0) {
      const paymentId = randomUUID()
      const idempotencyKey = randomUUID()
      let paymentData = {
        method: method === 'card_on_file' ? 'square_card' : method,
        provider: ['square_card', 'card_on_file'].includes(method)
          ? 'square'
          : 'manual',
        provider_payment_id: null,
        status: 'completed',
        card_brand: null,
        card_last_four: null,
        receipt_url: null,
        failure_message: null,
      }

      if (method === 'card_on_file' && !loaded.savedPaymentMethod) {
        return json(response, 409, { error: 'saved_card_unavailable' })
      }

      if (['square_card', 'card_on_file'].includes(method)) {
        const sourceId =
          method === 'card_on_file'
            ? loaded.savedPaymentMethod.square_card_id
            : request.body?.sourceId
        const squareResult = await processSquarePayment({
          sourceId,
          amountCents: amountDueCents,
          tipCents: Math.min(calculated.tip_cents, amountDueCents),
          idempotencyKey,
          checkoutId: loaded.checkout.id,
          customerName: loaded.appointment.customer_name,
          customerId:
            method === 'card_on_file'
              ? loaded.savedPaymentMethod.square_customer_id
              : undefined,
        })
        if (squareResult.error) {
          return json(response, 502, { error: squareResult.error })
        }
        const squarePayment = squareResult.payment
        paymentData = {
          ...paymentData,
          provider_payment_id: squarePayment.id,
          status:
            squarePayment.status === 'COMPLETED' ? 'completed' : 'pending',
          card_brand: squarePayment.card_details?.card?.card_brand ?? null,
          card_last_four:
            squarePayment.card_details?.card?.last_4 ?? null,
          receipt_url: squarePayment.receipt_url ?? null,
        }
      }

      if (method === 'gift_card') {
      if (!isGiftCardCode(request.body?.giftCardCode)) {
        return json(response, 400, { error: 'invalid_gift_card_code' })
      }

      const { data, error } = await adminClient.rpc('redeem_gift_card', {
        p_code_hash: hashGiftCardCode(request.body?.giftCardCode),
        p_checkout_id: loaded.checkout.id,
          p_amount_cents: amountDueCents,
        p_acted_by: profile.id,
      })

      if (error) {
        return json(response, 500, { error: 'gift_card_redeem_failed' })
      }
      if (data?.error) {
        return json(response, 409, data)
      }

      giftCardRedemption = data
      paymentData = {
        ...paymentData,
        provider_payment_id: data.transaction_id,
        card_brand: 'ORA Gift Card',
        card_last_four: data.last_four,
      }
    }

    let paymentError = null

    if (method === 'gift_card' && giftCardRedemption?.idempotent) {
      const existingPayment = await adminClient
        .from('payments')
        .select('*')
        .eq('provider_payment_id', giftCardRedemption.transaction_id)
        .maybeSingle()
      payment = existingPayment.data
      paymentError = existingPayment.error
    }

      if (
        (!payment || completedPayments.includes(payment)) &&
        !paymentError
      ) {
      const paymentResult = await adminClient
        .from('payments')
        .insert({
          id: paymentId,
          checkout_id: loaded.checkout.id,
          ...paymentData,
          idempotency_key: idempotencyKey,
            amount_cents: amountDueCents,
          processed_at: new Date().toISOString(),
          created_by: profile.id,
        })
        .select('*')
        .single()
      payment = paymentResult.data
      paymentError = paymentResult.error
    }

    if (paymentError || !payment) {
      return json(response, 500, { error: 'payment_record_failed' })
    }
    }

    const paymentCompleted =
      amountDueCents === 0 || payment?.status === 'completed'
    if (calculated.tip_cents > 0 && primaryProviderId && payment) {
    await adminClient.from('tip_allocations').upsert(
      {
        checkout_id: loaded.checkout.id,
        payment_id: payment.id,
        staff_id: primaryProviderId,
        amount_cents: calculated.tip_cents,
      },
      { onConflict: 'checkout_id,staff_id' },
    )
  }

  const now = new Date().toISOString()
  const { items: calculatedItems, ...checkoutTotals } = calculated
  const { error: checkoutError } = await adminClient
    .from('checkouts')
    .update({
      ...checkoutTotals,
      provider_id: primaryProviderId,
      currency: settings.currency,
        status: paymentCompleted ? 'paid' : 'payment_pending',
        closed_at: paymentCompleted ? now : null,
        closed_by: paymentCompleted ? profile.id : null,
      updated_at: now,
      updated_by: profile.id,
    })
    .eq('id', loaded.checkout.id)

  if (checkoutError) {
    return json(response, 500, { error: 'checkout_complete_failed' })
  }

    if (paymentCompleted) {
    await adminClient
      .from('appointments')
      .update({
        status: 'checked_out',
        updated_by: profile.id,
      })
      .eq('id', appointmentId)
  }

  await adminClient.from('checkout_history').insert({
    checkout_id: loaded.checkout.id,
    action:
        paymentCompleted
        ? 'payment_completed'
        : 'payment_pending',
    details: {
        payment_id: payment?.id ?? null,
        method: amountDueCents > 0 ? method : 'prepaid',
      total_cents: calculated.total_cents,
        already_paid_cents: alreadyPaidCents,
        amount_due_cents: amountDueCents,
      tip_cents: calculated.tip_cents,
        gift_card_last_four: giftCardRedemption?.last_four ?? null,
        gift_card_balance_cents:
          giftCardRedemption?.balance_cents ?? null,
    },
    acted_by: profile.id,
  })

  return json(
    response,
    200,
    await loadCheckout(adminClient, appointmentId),
  )
}
