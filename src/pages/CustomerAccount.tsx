import { useEffect, useState } from 'react'
import {
  CalendarDays,
  BadgeCheck,
  CreditCard,
  Gift,
  LogOut,
  UserRound,
} from 'lucide-react'
import { Header } from '../components/Header'
import { useCustomerAuth } from '../contexts/customerAuth'
import { customerCopy } from '../customerCopy'
import { formatEasternDateTime } from '../lib/dateTime'
import { useSiteStore } from '../store/useSiteStore'

type AppointmentRecord = {
  id: string
  service: string
  provider_name: string | null
  starts_at: string | null
  status: string
  payment: {
    status: string
    amount_cents: number
    currency: string
    card_brand: string | null
    card_last_four: string | null
    receipt_url: string | null
  } | null
}

type GiftCardRecord = {
  id: string
  last_four: string
  initial_balance_cents: number
  balance_cents: number
  currency: string
  recipient_name: string | null
  purchaser_name: string | null
  active: boolean
  expires_at: string | null
  created_at: string
  relationship: 'purchased' | 'received' | 'both'
}

type CustomerRecords = {
  profile: { email: string; name: string; phone: string }
  appointments: AppointmentRecord[]
  giftCards: GiftCardRecord[]
  memberships: MembershipRecord[]
}

type MembershipRecord = {
  id: string
  status: 'active' | 'expired' | 'cancelled' | 'refunded'
  complimentary_service_code: 'pure-reset' | 'vital-glow'
  complimentary_redeemed_at: string | null
  starts_at: string
  expires_at: string
  receipt_url: string | null
}

const money = (cents: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100)

export default function CustomerAccount() {
  const locale = useSiteStore((state) => state.locale)
  const t = customerCopy[locale]
  const { session, user, loading: authLoading, openAuth, signOut } =
    useCustomerAuth()
    const [activeTab, setActiveTab] = useState<
      'appointments' | 'membership' | 'gifts'
    >(
    'appointments',
  )
  const [records, setRecords] = useState<CustomerRecords | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) {
      setRecords(null)
      return
    }

    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch('/api/bookings?mine=1', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          signal: controller.signal,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setRecords(data)
      } catch (loadError) {
        if ((loadError as Error).name !== 'AbortError') {
          setError(t.loadFailed)
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [session, t.loadFailed])

  const formatDate = (value: string | null) =>
    value
        ? formatEasternDateTime(value, locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
          })
      : ''

  const giftStatus = (card: GiftCardRecord) =>
    card.expires_at && new Date(card.expires_at).getTime() <= Date.now()
      ? t.expired
      : card.active
        ? t.active
        : t.inactive
    const membershipLabels =
      locale === 'zh' || locale === 'zh-TW'
        ? {
            tab: '年度会员',
            active: '有效会员',
            expired: '已过期',
            validThrough: '有效期至',
            complimentary: '赠送项目',
            available: '尚未使用',
            redeemed: '已核销',
            none: '暂无会员卡',
            join: '加入 Annual Membership',
          }
        : {
            tab: 'Membership',
            active: 'Active membership',
            expired: 'Expired',
            validThrough: 'Valid through',
            complimentary: 'Complimentary experience',
            available: 'Available',
            redeemed: 'Redeemed',
            none: 'No membership yet',
            join: 'Join Annual Membership',
          }

  return (
    <main className="customer-account-page">
      <Header
        actionHref={`/?lang=${locale}`}
        actionLabel={t.backHome}
        returnToHome
      />
      <section className="customer-account-head">
        <div>
          <span><UserRound size={18} />{t.account}</span>
          <h1>{t.accountTitle}</h1>
          <p>{t.accountIntro}</p>
        </div>
        {user && (
          <button type="button" onClick={() => void signOut()}>
            <LogOut size={17} />
            {t.signOut}
          </button>
        )}
      </section>

      <section className="customer-account-content">
        {authLoading ? (
          <p className="customer-account-state">{t.loading}</p>
        ) : !user ? (
          <div className="customer-account-signin">
            <UserRound size={28} />
            <h2>{t.signInTitle}</h2>
            <p>{t.signInPrompt}</p>
            <button type="button" onClick={() => openAuth('sign-in')}>
              {t.signIn}
            </button>
          </div>
        ) : (
          <>
            <div className="customer-account-profile">
              <strong>{records?.profile.name || user.email}</strong>
              <span>{records?.profile.email || user.email}</span>
            </div>
            <div className="customer-account-tabs" role="tablist">
              <button
                className={activeTab === 'appointments' ? 'is-active' : ''}
                type="button"
                onClick={() => setActiveTab('appointments')}
              >
                <CalendarDays size={16} />
                {t.appointments}
              </button>
              <button
                className={activeTab === 'membership' ? 'is-active' : ''}
                type="button"
                onClick={() => setActiveTab('membership')}
              >
                <BadgeCheck size={16} />
                {membershipLabels.tab}
              </button>
              <button
                className={activeTab === 'gifts' ? 'is-active' : ''}
                type="button"
                onClick={() => setActiveTab('gifts')}
              >
                <Gift size={16} />
                {t.giftCards}
              </button>
            </div>

            {loading && <p className="customer-account-state">{t.loading}</p>}
            {error && <p className="customer-account-state is-error">{error}</p>}

            {!loading && !error && activeTab === 'appointments' && (
              <div className="customer-record-list">
                {records?.appointments.length ? (
                  records.appointments.map((appointment) => (
                    <article className="customer-record" key={appointment.id}>
                      <div className="customer-record__head">
                        <div>
                          <span>{formatDate(appointment.starts_at)}</span>
                          <h2>{appointment.service}</h2>
                        </div>
                        <strong>{t.status[appointment.status] ?? appointment.status}</strong>
                      </div>
                      <dl>
                        <div><dt>{t.provider}</dt><dd>{appointment.provider_name ?? 'ORA'}</dd></div>
                        {appointment.payment && (
                          <div>
                            <dt>{t.payment}</dt>
                            <dd>
                              {money(appointment.payment.amount_cents, appointment.payment.currency, locale)}
                              {appointment.payment.card_last_four
                                ? ` · ${t.cardEnding} ${appointment.payment.card_last_four}`
                                : ''}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </article>
                  ))
                ) : (
                  <p className="customer-account-state">{t.noAppointments}</p>
                )}
              </div>
            )}

            {!loading && !error && activeTab === 'gifts' && (
              <div className="customer-record-list">
                {records?.giftCards.length ? (
                  records.giftCards.map((card) => (
                    <article className="customer-record" key={card.id}>
                      <div className="customer-record__head">
                        <div>
                          <span>
                            {card.relationship === 'purchased'
                              ? t.purchased
                              : card.relationship === 'received'
                                ? t.received
                                : t.both}
                          </span>
                          <h2>ORA ···· {card.last_four}</h2>
                        </div>
                        <strong>{giftStatus(card)}</strong>
                      </div>
                      <dl>
                        <div>
                          <dt>{t.balance}</dt>
                          <dd>{money(card.balance_cents, card.currency, locale)}</dd>
                        </div>
                        <div>
                          <dt>
                            {card.relationship === 'received'
                              ? t.receivedFrom
                              : t.purchasedFor}
                          </dt>
                          <dd>
                            {card.relationship === 'received'
                              ? card.purchaser_name
                              : card.recipient_name}
                          </dd>
                        </div>
                      </dl>
                      <CreditCard size={18} aria-hidden="true" />
                    </article>
                  ))
                ) : (
                  <p className="customer-account-state">{t.noGiftCards}</p>
                )}
              </div>
            )}

            {!loading && !error && activeTab === 'membership' && (
              <div className="customer-record-list">
                {records?.memberships.length ? (
                  records.memberships.map((membership) => {
                    const active =
                      membership.status === 'active' &&
                      new Date(membership.expires_at).getTime() > Date.now()
                    return (
                      <article className="customer-record" key={membership.id}>
                        <div className="customer-record__head">
                          <div>
                            <span>
                              {active
                                ? membershipLabels.active
                                : membershipLabels.expired}
                            </span>
                            <h2>ORA Annual Membership</h2>
                          </div>
                          <strong>
                            {active ? '$288 / Year' : membershipLabels.expired}
                          </strong>
                        </div>
                        <dl>
                          <div>
                            <dt>{membershipLabels.validThrough}</dt>
                            <dd>{formatDate(membership.expires_at)}</dd>
                          </div>
                          <div>
                            <dt>{membershipLabels.complimentary}</dt>
                            <dd>
                              {membership.complimentary_service_code ===
                              'pure-reset'
                                ? 'Pure Reset'
                                : 'Vital Glow'}
                              {' · '}
                              {membership.complimentary_redeemed_at
                                ? membershipLabels.redeemed
                                : membershipLabels.available}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    )
                  })
                ) : (
                  <div className="customer-account-state">
                    <p>{membershipLabels.none}</p>
                    <a href={`/membership?lang=${locale}`}>
                      {membershipLabels.join}
                    </a>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
