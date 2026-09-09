import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  BadgeDollarSign,
  CreditCard,
  Minus,
  Plus,
  ReceiptText,
  Trash2,
} from 'lucide-react'
import type {
  Appointment,
  Checkout,
  CheckoutItem,
  Payment,
  Product,
  Service,
  StaffProfile,
} from '../../lib/supabase'
import { formatEasternDateTime } from '../../lib/dateTime'

type EditableItem = Omit<
  CheckoutItem,
  | 'id'
  | 'checkout_id'
  | 'line_subtotal_cents'
  | 'discount_cents'
  | 'membership_discount_cents'
  | 'membership_complimentary_applied'
  | 'tax_cents'
  | 'line_total_cents'
  | 'commission_base_cents'
  | 'display_order'
>

type CheckoutResponse = {
  appointment: Appointment
  checkout: Checkout | null
  items: CheckoutItem[]
  payments: Payment[]
  tips: {
    id: string
    staff_id: string
    amount_cents: number
  }[]
  products: Product[]
  services: Service[]
  taxRateBps: number
  appointmentPayment: {
    amount_cents: number
    status: 'pending' | 'completed' | 'failed' | 'refunded'
  } | null
  savedPaymentMethod: {
    id: string
    card_brand: string | null
    card_last_four: string | null
    status: 'active' | 'disabled'
  } | null
  membershipBenefit: {
    membershipId: string
    expiresAt: string
    serviceDiscountBps: 1000 | 2000
    productDiscountBps: 2000
    complimentaryServiceCode: 'pure-reset' | 'vital-glow'
    complimentaryServiceId: string | null
    complimentaryAvailable: boolean
  } | null
}

type PaymentChoice = Payment['method'] | 'card_on_file'

type SquareConfig = {
  enabled: boolean
  applicationId: string | null
  locationId: string | null
  environment: 'sandbox' | 'production'
}

type Props = {
  appointments: Appointment[]
  staff: StaffProfile[]
  session: Session
  locale: 'zh' | 'en'
  onCompleted: () => void
}

declare global {
  interface Window {
    Square?: {
      payments: (
        applicationId: string,
        locationId: string,
      ) => Promise<{
        card: () => Promise<{
          attach: (selector: string) => Promise<void>
          tokenize: () => Promise<{
            status: string
            token?: string
            errors?: { message: string }[]
          }>
          destroy: () => Promise<void>
        }>
      }>
    }
  }
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function CheckoutManager({
  appointments,
  staff,
  session,
  locale,
  onCompleted,
}: Props) {
  const [selectedId, setSelectedId] = useState('')
  const [data, setData] = useState<CheckoutResponse | null>(null)
  const [items, setItems] = useState<EditableItem[]>([])
  const [discount, setDiscount] = useState('0')
  const [tipMode, setTipMode] = useState<'15' | '20' | '25' | 'custom' | 'none'>('20')
  const [customTip, setCustomTip] = useState('0')
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentChoice>('external_card')
  const [giftCardCode, setGiftCardCode] = useState('')
  const [squareConfig, setSquareConfig] = useState<SquareConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const t =
    locale === 'zh'
      ? {
          title: 'Checkout / 收款',
          note: '从原预约确认项目、折扣、税、小费和付款。',
          select: '选择待结账预约',
          open: '打开 Checkout',
          noAppointments: '暂无可结账预约',
          item: '项目',
          provider: '技师',
          quantity: '数量',
          price: '单价',
          addProduct: '添加产品',
          addService: '添加服务',
          addOn: '添加 Add-on',
          discount: '折扣',
            membershipDiscount: '会员优惠',
            manualDiscount: '额外折扣',
            membershipActive: 'Annual Membership 已应用',
            complimentaryApplied: '本次已应用免费 Signature Experience',
          tip: '小费',
          custom: '自定义',
          noTip: '不加小费',
          subtotal: '小计',
          tax: '税',
          total: '总计',
            prepaid: '预约已预付',
            balanceDue: '剩余应付',
          payment: '付款方式',
          savedCard: '预约时保存的卡',
          square: 'Square Card',
          cash: '现金',
          external: '外部刷卡',
          giftCard: '礼品卡',
            giftCardCode: '礼品卡卡号',
            giftCardPlaceholder: 'ORA-XXXX-XXXX-XXXX',
            giftCardInvalid: '礼品卡无效、已停用或已过期。',
            giftCardBalance: '礼品卡余额不足以支付本次全部金额。',
          other: '其他',
          save: '保存 Checkout',
          pay: '完成付款',
          paid: '付款完成，预约已结账。',
          receipt: '查看付款收据',
          failed: '操作失败，请重试。',
          squareUnavailable: 'Square 尚未配置，当前可使用门店线下付款。',
          remove: '删除',
        }
      : {
          title: 'Checkout',
          note: 'Confirm services, discounts, tax, tips and payment from the original appointment.',
          select: 'Select an appointment',
          open: 'Open Checkout',
          noAppointments: 'No appointments are ready for checkout',
          item: 'Item',
          provider: 'Provider',
          quantity: 'Qty',
          price: 'Unit price',
          addProduct: 'Add product',
          addService: 'Add service',
          addOn: 'Add add-on',
          discount: 'Discount',
            membershipDiscount: 'Membership savings',
            manualDiscount: 'Additional discount',
            membershipActive: 'Annual Membership applied',
            complimentaryApplied: 'Complimentary Signature Experience applied',
          tip: 'Tip',
          custom: 'Custom',
          noTip: 'No tip',
          subtotal: 'Subtotal',
          tax: 'Tax',
          total: 'Total',
            prepaid: 'Booking prepayment',
            balanceDue: 'Balance due',
          payment: 'Payment method',
          savedCard: 'Saved card on file',
          square: 'Square Card',
          cash: 'Cash',
          external: 'External Card',
          giftCard: 'Gift Card',
            giftCardCode: 'Gift card code',
            giftCardPlaceholder: 'ORA-XXXX-XXXX-XXXX',
            giftCardInvalid: 'This gift card is invalid, inactive, or expired.',
            giftCardBalance: 'The gift card balance cannot cover the full total.',
          other: 'Other',
          save: 'Save Checkout',
          pay: 'Complete Payment',
          paid: 'Payment completed and appointment checked out.',
          receipt: 'View payment receipt',
          failed: 'Unable to complete this action.',
          squareUnavailable: 'Square is not configured. Manual store payments remain available.',
          remove: 'Remove',
        }

  const eligibleAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          ![
            'cancelled_or_changed_outside_24h',
            'cancelled_or_changed_within_24h',
            'no_show_no_contact',
            'checked_out',
          ].includes(appointment.status) &&
          appointment.service_id &&
          appointment.provider_id,
      ),
    [appointments],
  )

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_cents,
    0,
  )
    let complimentaryAvailable = Boolean(
      data?.membershipBenefit?.complimentaryAvailable,
    )
    const membershipLineDiscounts = items.map((item) => {
      const lineSubtotal = item.quantity * item.unit_price_cents
      const complimentaryApplied =
        complimentaryAvailable &&
        item.item_type === 'service' &&
        item.service_id === data?.membershipBenefit?.complimentaryServiceId
      const complimentaryDiscount = complimentaryApplied
        ? item.unit_price_cents
        : 0
      if (complimentaryApplied) complimentaryAvailable = false
      const percentageBps =
        item.item_type === 'product'
          ? data?.membershipBenefit?.productDiscountBps ?? 0
          : ['service', 'add_on'].includes(item.item_type)
            ? data?.membershipBenefit?.serviceDiscountBps ?? 0
            : 0
      return Math.min(
        lineSubtotal,
        complimentaryDiscount +
          Math.round(
            Math.max(0, lineSubtotal - complimentaryDiscount) *
              percentageBps /
              10000,
          ),
      )
    })
    const membershipDiscountCents = membershipLineDiscounts.reduce(
      (sum, value) => sum + value,
      0,
    )
    const remainingAfterMembership = subtotal - membershipDiscountCents
    const manualDiscountCents = Math.min(
      Math.max(0, remainingAfterMembership),
    Math.max(0, Math.round(Number(discount || 0) * 100)),
  )
    const preTax =
      subtotal - membershipDiscountCents - manualDiscountCents
    let remainingManualDiscount = manualDiscountCents
    const displayedTax = items.reduce((sum, item, index) => {
    const lineSubtotal = item.quantity * item.unit_price_cents
      const lineAfterMembership =
        lineSubtotal - membershipLineDiscounts[index]
      const manualLineDiscount =
        index === items.length - 1
          ? remainingManualDiscount
          : Math.min(
              remainingManualDiscount,
              Math.round(
                manualDiscountCents *
                  (lineAfterMembership /
                    Math.max(remainingAfterMembership, 1)),
              ),
            )
      remainingManualDiscount -= manualLineDiscount
      if (!item.taxable) return sum
    return (
      sum +
      Math.round(
          Math.max(0, lineAfterMembership - manualLineDiscount) *
          (data?.taxRateBps ?? 0) /
          10000,
      )
    )
  }, 0)
  const tipCents =
    tipMode === 'none'
      ? 0
      : tipMode === 'custom'
        ? Math.max(0, Math.round(Number(customTip || 0) * 100))
        : Math.round(preTax * Number(tipMode) / 100)
  const estimatedTotal = preTax + displayedTax + tipCents
  const paidCents =
    data?.payments
      .filter((payment) => payment.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount_cents, 0) ?? 0
  const amountDueCents = Math.max(0, estimatedTotal - paidCents)
  const receiptUrl = [...(data?.payments ?? [])]
    .reverse()
    .find((payment) => payment.receipt_url)?.receipt_url

  useEffect(() => {
    void fetch('/api/square-config')
      .then((response) => response.json())
      .then((config: SquareConfig) => setSquareConfig(config))
      .catch(() => setSquareConfig(null))
  }, [])

  const request = async (
    method: 'GET' | 'POST',
    body?: Record<string, unknown>,
  ) => {
    const query =
      method === 'GET'
        ? `?appointmentId=${encodeURIComponent(selectedId)}`
        : ''
    const response = await fetch(`/api/checkout${query}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: method === 'POST' ? JSON.stringify(body) : undefined,
    })
    const result = (await response.json()) as CheckoutResponse & {
      error?: string
    }
    if (!response.ok) throw new Error(result.error ?? 'checkout_failed')
    return result
  }

  const sync = (result: CheckoutResponse) => {
    setData(result)
    setItems(
      result.items.map((item) => ({
        item_type: item.item_type,
        service_id: item.service_id,
        product_id: item.product_id,
        provider_id: item.provider_id,
        description: item.description,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        taxable: item.taxable,
        commissionable: item.commissionable,
      })),
    )
    setDiscount(
        (
          ((result.checkout?.discount_cents ?? 0) -
            (result.checkout?.membership_discount_cents ?? 0)) /
          100
        ).toFixed(2),
    )
    setCustomTip(((result.checkout?.tip_cents ?? 0) / 100).toFixed(2))
    setPaymentMethod(
      result.savedPaymentMethod ? 'card_on_file' : 'external_card',
    )
  }

  const openCheckout = async () => {
    if (!selectedId) return
    setLoading(true)
    setMessage('')
    try {
      let result = await request('GET')
      if (!result.checkout) {
        result = await request('POST', {
          action: 'open',
          appointmentId: selectedId,
        })
      }
      sync(result)
      } catch {
        setMessage(t.failed)
    } finally {
      setLoading(false)
    }
  }

  const itemPayload = () =>
    items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unit_price_cents: Number(item.unit_price_cents),
    }))

  const save = async () => {
    if (!data?.checkout) return
    setLoading(true)
    setMessage('')
    try {
      const result = await request('POST', {
        action: 'save',
        appointmentId: selectedId,
        items: itemPayload(),
          discountCents: manualDiscountCents,
        tipCents,
      })
      sync(result)
    } catch {
      setMessage(t.failed)
    } finally {
      setLoading(false)
    }
  }

  const squareToken = async () => {
    if (
      !squareConfig?.enabled ||
      !squareConfig.applicationId ||
      !squareConfig.locationId
    ) {
      throw new Error('square_not_configured')
    }

    const scriptUrl =
      squareConfig.environment === 'production'
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js'
    if (!window.Square) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = scriptUrl
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('square_load_failed'))
        document.head.appendChild(script)
      })
    }
    if (!window.Square) throw new Error('square_load_failed')

    const payments = await window.Square.payments(
      squareConfig.applicationId,
      squareConfig.locationId,
    )
    const card = await payments.card()
    await card.attach('#square-card-container')
    const result = await card.tokenize()
    await card.destroy()
    if (result.status !== 'OK' || !result.token) {
      throw new Error(
        result.errors?.map((error) => error.message).join('; ') ||
          'card_token_failed',
      )
    }
    return result.token
  }

  const complete = async () => {
    if (!data?.checkout) return
    setLoading(true)
    setMessage('')
    try {
      const sourceId =
        paymentMethod === 'square_card' && amountDueCents > 0
          ? await squareToken()
          : undefined
      const result = await request('POST', {
        action: 'complete',
        appointmentId: selectedId,
        items: itemPayload(),
          discountCents: manualDiscountCents,
        tipCents,
        paymentMethod,
        sourceId,
          giftCardCode:
            paymentMethod === 'gift_card' ? giftCardCode : undefined,
      })
      sync(result)
      setMessage(t.paid)
      onCompleted()
      } catch (error) {
        const code = error instanceof Error ? error.message : ''
        setMessage(
          code === 'gift_card_insufficient_balance'
            ? t.giftCardBalance
            : [
                  'invalid_gift_card_code',
                  'gift_card_not_found',
                  'gift_card_inactive',
                  'gift_card_expired',
                ].includes(code)
              ? t.giftCardInvalid
              : t.failed,
        )
    } finally {
      setLoading(false)
    }
  }

  const updateItem = (
    index: number,
    updates: Partial<EditableItem>,
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item,
      ),
    )
  }

  const addProduct = (productId: string) => {
    const product = data?.products.find((item) => item.id === productId)
    if (!product) return
    setItems((current) => [
      ...current,
      {
        item_type: 'product',
        service_id: null,
        product_id: product.id,
        provider_id: data?.appointment.provider_id ?? null,
        description: product.name,
        quantity: 1,
        unit_price_cents: product.price_cents,
        taxable: product.taxable,
        commissionable: product.commissionable,
      },
    ])
  }

  const addService = (selectedServiceId: string) => {
    const service = data?.services.find(
      (item) => item.id === selectedServiceId,
    )
    if (!service || service.price_cents === null) return
    setItems((current) => [
      ...current,
      {
        item_type: 'service',
        service_id: service.id,
        product_id: null,
        provider_id: data?.appointment.provider_id ?? null,
        description: service.name,
        quantity: 1,
        unit_price_cents: service.price_cents,
        taxable: service.taxable,
        commissionable: service.commissionable,
      },
    ])
  }

  return (
    <section className="admin-panel checkout-manager">
      <header>
        <div>
          <ReceiptText size={21} />
          <div>
            <h2>{t.title}</h2>
            <p>{t.note}</p>
          </div>
        </div>
      </header>

      <div className="checkout-picker">
        <select
          value={selectedId}
          onChange={(event) => {
            setSelectedId(event.target.value)
            setData(null)
          }}
        >
          <option value="">
            {eligibleAppointments.length ? t.select : t.noAppointments}
          </option>
          {eligibleAppointments.map((appointment) => (
            <option key={appointment.id} value={appointment.id}>
              {appointment.customer_name} · {appointment.service} ·{' '}
              {appointment.starts_at
                  ? formatEasternDateTime(
                      appointment.starts_at,
                    locale === 'zh' ? 'zh-CN' : 'en-US',
                    { dateStyle: 'short', timeStyle: 'short' },
                    )
                : appointment.preferred_date}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selectedId || loading}
          onClick={() => void openCheckout()}
        >
          <BadgeDollarSign size={16} />
          {t.open}
        </button>
      </div>

      {message && <p className="checkout-message">{message}</p>}
      {receiptUrl && (
        <a
          className="checkout-receipt-link"
          href={receiptUrl}
          target="_blank"
          rel="noreferrer"
        >
          <ReceiptText size={15} />
          {t.receipt}
        </a>
      )}

      {data?.checkout && (
        <div className="checkout-workspace">
          <div className="checkout-items">
            <div className="checkout-items__head">
              <span>{t.item}</span>
              <span>{t.provider}</span>
              <span>{t.quantity}</span>
              <span>{t.price}</span>
              <span />
            </div>
            {items.map((item, index) => (
              <div className="checkout-item" key={`${item.description}-${index}`}>
                <input
                  value={item.description}
                  onChange={(event) =>
                    updateItem(index, { description: event.target.value })
                  }
                />
                <select
                  value={item.provider_id ?? ''}
                  onChange={(event) =>
                    updateItem(index, {
                      provider_id: event.target.value || null,
                    })
                  }
                >
                  <option value="">—</option>
                  {staff
                    .filter((profile) => profile.role === 'staff' && profile.active)
                    .map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.display_name}
                      </option>
                    ))}
                </select>
                <div className="checkout-quantity">
                  <button
                    type="button"
                    onClick={() =>
                      updateItem(index, {
                        quantity: Math.max(1, item.quantity - 1),
                      })
                    }
                  >
                    <Minus size={13} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateItem(index, { quantity: item.quantity + 1 })
                    }
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={(item.unit_price_cents / 100).toFixed(2)}
                  onChange={(event) =>
                    updateItem(index, {
                      unit_price_cents: Math.max(
                        0,
                        Math.round(Number(event.target.value) * 100),
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  aria-label={t.remove}
                  onClick={() =>
                    setItems((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            <div className="checkout-add">
              <select
                defaultValue=""
                onChange={(event) => {
                  addService(event.target.value)
                  event.target.value = ''
                }}
              >
                <option value="">{t.addService}</option>
                {data.services
                  .filter((service) => service.price_cents !== null)
                  .map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} · {money(service.price_cents ?? 0)}
                    </option>
                  ))}
              </select>
              <select
                defaultValue=""
                onChange={(event) => {
                  addProduct(event.target.value)
                  event.target.value = ''
                }}
              >
                <option value="">{t.addProduct}</option>
                {data.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ·{' '}
                    {money(
                      data.membershipBenefit
                        ? Math.round(product.price_cents * 0.8)
                        : product.price_cents,
                    )}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setItems((current) => [
                    ...current,
                    {
                      item_type: 'add_on',
                      service_id: null,
                      product_id: null,
                      provider_id: data.appointment.provider_id,
                      description: 'Add-on',
                      quantity: 1,
                      unit_price_cents: 0,
                      taxable: true,
                      commissionable: true,
                    },
                  ])
                }
              >
                <Plus size={15} />
                {t.addOn}
              </button>
            </div>
          </div>

          <aside className="checkout-summary">
            <label>
                <span>{t.manualDiscount}</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
              />
            </label>
            <fieldset>
              <legend>{t.tip}</legend>
              <div className="checkout-tip-options">
                {(['15', '20', '25'] as const).map((option) => (
                  <button
                    type="button"
                    className={tipMode === option ? 'is-active' : ''}
                    key={option}
                    onClick={() => setTipMode(option)}
                  >
                    {option}%
                  </button>
                ))}
                <button
                  type="button"
                  className={tipMode === 'custom' ? 'is-active' : ''}
                  onClick={() => setTipMode('custom')}
                >
                  {t.custom}
                </button>
                <button
                  type="button"
                  className={tipMode === 'none' ? 'is-active' : ''}
                  onClick={() => setTipMode('none')}
                >
                  {t.noTip}
                </button>
              </div>
              {tipMode === 'custom' && (
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={customTip}
                  onChange={(event) => setCustomTip(event.target.value)}
                />
              )}
            </fieldset>

            <dl>
                {data.membershipBenefit && (
                  <div className="checkout-membership-status">
                    <dt>{t.membershipActive}</dt>
                    <dd>
                      {data.membershipBenefit.complimentaryAvailable &&
                      items.some(
                        (item) =>
                          item.service_id ===
                          data.membershipBenefit?.complimentaryServiceId,
                      )
                        ? t.complimentaryApplied
                        : `${data.membershipBenefit.serviceDiscountBps / 100}% / 20%`}
                    </dd>
                  </div>
                )}
              <div>
                <dt>{t.subtotal}</dt>
                <dd>{money(subtotal)}</dd>
              </div>
              <div>
                  <dt>{t.membershipDiscount}</dt>
                  <dd>-{money(membershipDiscountCents)}</dd>
                </div>
                <div>
                  <dt>{t.manualDiscount}</dt>
                  <dd>-{money(manualDiscountCents)}</dd>
              </div>
              <div>
                <dt>{t.tax}</dt>
                <dd>{money(displayedTax)}</dd>
              </div>
              <div>
                <dt>{t.tip}</dt>
                <dd>{money(tipCents)}</dd>
              </div>
              <div className="checkout-total">
                <dt>{t.total}</dt>
                <dd>{money(estimatedTotal)}</dd>
              </div>
                {paidCents > 0 && (
                  <div>
                    <dt>{t.prepaid}</dt>
                    <dd>-{money(Math.min(paidCents, estimatedTotal))}</dd>
                  </div>
                )}
                <div className="checkout-total">
                  <dt>{t.balanceDue}</dt>
                  <dd>{money(amountDueCents)}</dd>
                </div>
            </dl>

              {amountDueCents > 0 && (
                <>
                <label>
                    <span>{t.payment}</span>
                    <select
                      value={paymentMethod}
                      onChange={(event) =>
                        setPaymentMethod(
                          event.target.value as PaymentChoice,
                        )
                    }
                    >
                      {data.savedPaymentMethod && (
                        <option value="card_on_file">
                          {t.savedCard} ·{' '}
                          {data.savedPaymentMethod.card_brand ?? 'Card'} ••••{' '}
                          {data.savedPaymentMethod.card_last_four}
                        </option>
                      )}
                      <option
                        value="square_card"
                        disabled={!squareConfig?.enabled}
                      >
                        {t.square}
                      </option>
                      <option value="cash">{t.cash}</option>
                      <option value="external_card">{t.external}</option>
                      <option value="gift_card">{t.giftCard}</option>
                      <option value="other">{t.other}</option>
                    </select>
                </label>
                  {!squareConfig?.enabled && (
                    <p>{t.squareUnavailable}</p>
                  )}
                  {paymentMethod === 'square_card' && (
                    <div id="square-card-container" />
                  )}
                  {paymentMethod === 'gift_card' && (
                    <label>
                      <span>{t.giftCardCode}</span>
                      <input
                        value={giftCardCode}
                        placeholder={t.giftCardPlaceholder}
                        autoComplete="off"
                        onChange={(event) =>
                          setGiftCardCode(event.target.value.toUpperCase())
                        }
                      />
                    </label>
                  )}
                </>
              )}
            <div className="checkout-summary__actions">
              <button
                type="button"
                disabled={loading}
                onClick={() => void save()}
              >
                {t.save}
              </button>
              <button
                type="button"
                  disabled={
                    loading ||
                    items.length === 0 ||
                      (amountDueCents > 0 &&
                        paymentMethod === 'gift_card' &&
                        !giftCardCode.trim())
                  }
                onClick={() => void complete()}
              >
                <CreditCard size={15} />
                {t.pay}
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}
