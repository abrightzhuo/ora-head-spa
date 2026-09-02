import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  BadgeCheck,
  Check,
  CreditCard,
  Package,
  Sparkles,
} from 'lucide-react'
import { Header } from '../components/Header'
import { useCustomerAuth } from '../contexts/customerAuth'
import { customerCopy } from '../customerCopy'
import { formatEasternDateTime } from '../lib/dateTime'
import { useSiteStore, type Locale } from '../store/useSiteStore'

type SquareConfig = {
  enabled: boolean
  applicationId: string | null
  locationId: string | null
  environment: 'sandbox' | 'production'
}

type MembershipRecord = {
  id: string
  status: 'active' | 'expired' | 'cancelled' | 'refunded'
  complimentary_service_code: 'pure-reset' | 'vital-glow'
  complimentary_redeemed_at: string | null
  starts_at: string
  expires_at: string
  receipt_url: string | null
  payment_environment: 'sandbox' | 'production'
}

type MembershipCopy = {
  back: string
  eyebrow: string
  title: string
  price: string
  intro: string
  privileges: string
  complimentary: string
  complimentaryDetail: string
  annualSavings: string
  annualSavingsDetail: string
  weekday: string
  weekdayDetail: string
  products: string
  productsDetail: string
  journey: string
  journeyDetail: string
  philosophy: string
  philosophyDetail: string
  term: string
  choose: string
  name: string
  phone: string
  email: string
  payment: string
  buy: string
  processing: string
  unavailable: string
  failed: string
  active: string
  activeUntil: string
  complimentaryAvailable: string
  complimentaryUsed: string
  receipt: string
}

const english: MembershipCopy = {
  back: 'Back home',
  eyebrow: 'Invest in Your Scalp & Skin Wellness',
  title: 'Annual Membership',
  price: '$288 / Year',
  intro:
    'Designed for guests committed to long-term scalp health, beautiful hair, and healthy skin.',
  privileges: 'Member Privileges',
  complimentary: 'Complimentary Signature Experience',
  complimentaryDetail:
    'Choose one: Pure Reset or Vital Glow. A value of at least $168.',
  annualSavings: '10% Savings All Year',
  annualSavingsDetail:
    'Enjoy 10% off all scalp, hair, and skin treatments.',
  weekday: 'Member Weekday Privilege',
  weekdayDetail:
    'Receive 20% off treatments Monday through Thursday.',
  products: 'Exclusive Product Pricing',
  productsDetail: 'Enjoy 20% off all retail products for a full year.',
  journey: 'Professional Wellness Journey',
  journeyDetail:
    'Receive personalized scalp and skin care recommendations from our specialists.',
  philosophy: 'Because Healthy Hair Starts with a Healthy Scalp.',
  philosophyDetail:
    'Consistent professional care supports healthier hair, a balanced scalp, and healthier skin.',
  term: 'One membership per guest. Valid for 12 months.',
  choose: 'Choose your complimentary experience',
  name: 'Name',
  phone: 'Phone',
  email: 'Contact email',
  payment: 'Secure Square Payment',
  buy: 'Purchase Annual Membership',
  processing: 'Processing payment...',
  unavailable: 'Online membership payment is currently unavailable.',
  failed: 'Unable to complete the membership purchase. Please try again.',
  active: 'Your Annual Membership is active',
  activeUntil: 'Valid through',
  complimentaryAvailable: 'Complimentary experience available',
  complimentaryUsed: 'Complimentary experience redeemed',
  receipt: 'View Square receipt',
}

const chinese: MembershipCopy = {
  back: '返回首页',
  eyebrow: '投资长期头皮与肌肤健康',
  title: 'Annual Membership 年度会员',
  price: '$288 / 年',
  intro: '专为重视长期头皮健康、秀发状态与肌肤护理的顾客设计。',
  privileges: '会员权益',
  complimentary: '赠送一次 Signature Experience',
  complimentaryDetail: 'Pure Reset 或 Vital Glow 二选一，价值至少 $168。',
  annualSavings: '全年服务 9 折',
  annualSavingsDetail: '所有头皮、头发及肌肤护理项目享 10% 优惠。',
  weekday: '工作日会员礼遇',
  weekdayDetail: '周一至周四护理项目享 20% 优惠。',
  products: '会员专属产品价格',
  productsDetail: '全年所有零售产品享 20% 优惠。',
  journey: '专业健康护理计划',
  journeyDetail: '由专业护理师提供个性化头皮及肌肤养护建议。',
  philosophy: '健康秀发，始于健康头皮。',
  philosophyDetail: '持续的专业护理有助于保持健康秀发、平衡头皮与良好肌肤状态。',
  term: '每位顾客限一张会员卡，有效期 12 个月。',
  choose: '选择赠送项目',
  name: '姓名',
  phone: '手机号',
  email: '联系邮箱',
  payment: 'Square 安全支付',
  buy: '购买年度会员',
  processing: '正在处理付款...',
  unavailable: '在线会员付款暂不可用。',
  failed: '会员购买失败，请检查付款信息后重试。',
  active: '您的年度会员已生效',
  activeUntil: '有效期至',
  complimentaryAvailable: '赠送项目尚未使用',
  complimentaryUsed: '赠送项目已核销',
  receipt: '查看 Square 收据',
}

const membershipCopy: Record<Locale, MembershipCopy> = {
  zh: chinese,
  'zh-TW': { ...chinese, back: '返回首頁', term: '每位顧客限一張會員卡，有效期 12 個月。' },
  en: english,
  es: english,
  fr: english,
  ja: english,
  ko: english,
  de: english,
  ru: english,
}

export default function Membership() {
  const locale = useSiteStore((state) => state.locale)
  const t = membershipCopy[locale]
  const customerLabels = customerCopy[locale]
  const { session, openAuth, refreshMembership } = useCustomerAuth()
  const [config, setConfig] = useState<SquareConfig | null>(null)
  const [paymentReady, setPaymentReady] = useState(false)
  const [membership, setMembership] = useState<MembershipRecord | null>(null)
  const [choice, setChoice] =
    useState<MembershipRecord['complimentary_service_code']>('pure-reset')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const cardRef = useRef<{
    tokenize: (details: Record<string, unknown>) => Promise<{
      status: string
      token?: string
      errors?: { message: string }[]
    }>
    destroy: () => Promise<void>
  } | null>(null)

  useEffect(() => {
    void fetch('/api/square-config')
      .then((response) => response.json())
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [])

  useEffect(() => {
    if (!session) {
      setMembership(null)
      return
    }
    const metadata = session.user.user_metadata
    setName(String(metadata.full_name ?? metadata.name ?? ''))
    setPhone(String(metadata.phone ?? ''))
    setEmail(String(metadata.contact_email ?? session.user.email ?? ''))

    void fetch('/api/bookings?mine=1', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        const active = (data.memberships ?? []).find(
          (item: MembershipRecord) =>
            item.status === 'active' &&
            new Date(item.expires_at).getTime() > Date.now(),
        )
        setMembership(active ?? null)
      })
      .catch(() => setMembership(null))
  }, [session])

  useEffect(() => {
    if (
      membership ||
      !config?.enabled ||
      !config.applicationId ||
      !config.locationId
    ) {
      return
    }

    let cancelled = false
    let card: Awaited<ReturnType<NonNullable<Window['Square']>['payments']>> extends {
      card: () => Promise<infer T>
    }
      ? T
      : never
    const scriptUrl =
      config.environment === 'production'
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js'

    const initialize = async () => {
      if (!window.Square) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = scriptUrl
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('square_load_failed'))
          document.head.appendChild(script)
        })
      }
      if (!window.Square || cancelled) return
      const payments = await window.Square.payments(
        config.applicationId!,
        config.locationId!,
      )
      card = await payments.card()
      await card.attach('#membership-square')
      cardRef.current = card
      setPaymentReady(true)
    }

    void initialize().catch(() => setPaymentReady(false))
    return () => {
      cancelled = true
      setPaymentReady(false)
      cardRef.current = null
      if (card) void card.destroy()
    }
  }, [config, membership])

  const purchase = async (event: FormEvent) => {
    event.preventDefault()
    if (!session) {
      setMessage(customerLabels.loginToPay)
      openAuth('sign-in', { email, name, phone })
      return
    }
    if (!cardRef.current || !paymentReady) return

    setLoading(true)
    setMessage('')
    try {
      const token = await cardRef.current.tokenize({
        amount: '288.00',
        billingContact: { givenName: name, email, countryCode: 'US' },
        currencyCode: 'USD',
        intent: 'CHARGE',
        customerInitiated: true,
        sellerKeyedIn: false,
      })
      if (token.status !== 'OK' || !token.token) {
        throw new Error('card_token_failed')
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'purchase_membership',
          complimentaryServiceCode: choice,
          name,
          phone,
          email,
          sourceId: token.token,
          idempotencyKey: crypto.randomUUID(),
        }),
      })
      const data = await response.json()
      if (response.status === 401 || response.status === 403) {
        openAuth('sign-in', { email, name, phone })
        return
      }
      if (!response.ok && data.error !== 'active_membership_exists') {
        throw new Error(data.error ?? 'membership_purchase_failed')
      }
      setMembership(data.membership)
      await refreshMembership()
    } catch {
      setMessage(t.failed)
    } finally {
      setLoading(false)
    }
  }

  const complimentaryName =
    membership?.complimentary_service_code === 'vital-glow'
      ? 'Vital Glow'
      : 'Pure Reset'

  return (
    <main className="membership-page">
      <Header
        actionHref={`/?lang=${locale}`}
        actionLabel={t.back}
        returnToHome
      />

      <section className="membership-hero">
        <img src="/images/interior-01.jpg" alt="" />
        <div>
          <p>{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <strong>{t.price}</strong>
          <span>{t.intro}</span>
        </div>
      </section>

      <section className="membership-benefits">
        <header>
          <Sparkles size={18} />
          <h2>{t.privileges}</h2>
        </header>
        {[
          [t.complimentary, t.complimentaryDetail],
          [t.annualSavings, t.annualSavingsDetail],
          [t.weekday, t.weekdayDetail],
          [t.products, t.productsDetail],
          [t.journey, t.journeyDetail],
        ].map(([title, detail]) => (
          <article key={title}>
            <Check size={16} />
            <div>
              <h3>{title}</h3>
              <p>{detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="membership-purchase">
        {membership ? (
          <div className="membership-card">
            <BadgeCheck size={28} />
            <p>ORA / ANNUAL MEMBERSHIP</p>
            <h2>{t.active}</h2>
            <strong>{complimentaryName}</strong>
            <dl>
              <div>
                <dt>{t.activeUntil}</dt>
                <dd>
                  {formatEasternDateTime(membership.expires_at, locale, {
                    dateStyle: 'long',
                  })}
                </dd>
              </div>
              <div>
                <dt>{t.complimentary}</dt>
                <dd>
                  {membership.complimentary_redeemed_at
                    ? t.complimentaryUsed
                    : t.complimentaryAvailable}
                </dd>
              </div>
            </dl>
            {membership.receipt_url && (
              <a
                href={membership.receipt_url}
                target="_blank"
                rel="noreferrer"
              >
                {t.receipt}
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={purchase}>
            <fieldset>
              <legend>{t.choose}</legend>
              <div className="membership-choice">
                {(['pure-reset', 'vital-glow'] as const).map((value) => (
                  <button
                    className={choice === value ? 'is-active' : ''}
                    type="button"
                    key={value}
                    onClick={() => setChoice(value)}
                  >
                    {value === 'pure-reset' ? 'Pure Reset' : 'Vital Glow'}
                    <small>
                      {value === 'pure-reset' ? '$179 value' : '$169 value'}
                    </small>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="membership-fields">
              <label>
                <span>{t.name}</span>
                <input required value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label>
                <span>{t.phone}</span>
                <input required value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <label>
                <span>{t.email}</span>
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
            </div>
            <div className="membership-payment">
              <strong>
                <CreditCard size={17} />
                {t.payment}
              </strong>
              {config?.enabled ? (
                <div id="membership-square" />
              ) : (
                <p>{t.unavailable}</p>
              )}
            </div>
            {message && <p className="membership-error">{message}</p>}
            <button
              type="submit"
              disabled={loading || !config?.enabled || !paymentReady}
            >
              <Package size={17} />
              {loading ? t.processing : `${t.buy} · $288`}
            </button>
          </form>
        )}
      </section>

      <section className="membership-philosophy">
        <h2>{t.philosophy}</h2>
        <p>{t.philosophyDetail}</p>
        <strong>{t.term}</strong>
      </section>
    </main>
  )
}
