import { BadgeCheck, CalendarDays, Gift, Users } from 'lucide-react'
import { formatEasternDateTime } from '../../lib/dateTime'
import type { Customer, Membership } from '../../lib/supabase'

type Props = {
  locale: 'zh' | 'en'
  memberships: Membership[]
  customers: Customer[]
}

export function MembershipManager({
  locale,
  memberships,
  customers,
}: Props) {
  const t =
    locale === 'zh'
      ? {
          title: '年度会员',
          total: '会员总数',
          active: '有效会员',
          complimentary: '赠送项目待核销',
          customer: '顾客',
          term: '会员期限',
          benefit: '赠送项目',
          status: '状态',
          available: '待核销',
          redeemed: '已核销',
          expired: '已过期',
          cancelled: '已取消',
          refunded: '已退款',
          none: '暂无会员记录',
          sandbox: 'Sandbox 测试会员',
        }
      : {
          title: 'Annual Memberships',
          total: 'Total members',
          active: 'Active',
          complimentary: 'Experiences available',
          customer: 'Customer',
          term: 'Membership term',
          benefit: 'Complimentary experience',
          status: 'Status',
          available: 'Available',
          redeemed: 'Redeemed',
          expired: 'Expired',
          cancelled: 'Cancelled',
          refunded: 'Refunded',
          none: 'No memberships yet',
          sandbox: 'Sandbox test membership',
        }
  const now = Date.now()
  const activeMemberships = memberships.filter(
    (membership) =>
      membership.status === 'active' &&
      new Date(membership.expires_at).getTime() > now,
  )
  const availableBenefits = activeMemberships.filter(
    (membership) => !membership.complimentary_redeemed_at,
  )
  const customersById = new Map(
    customers.map((customer) => [customer.id, customer]),
  )
  const formatDate = (value: string) =>
    formatEasternDateTime(value, locale === 'zh' ? 'zh-CN' : 'en-US', {
      dateStyle: 'medium',
    })

  return (
    <section className="admin-panel membership-manager">
      <header>
        <div>
          <BadgeCheck size={21} />
          <h2>{t.title}</h2>
        </div>
      </header>

      <div className="membership-manager__metrics">
        <article>
          <Users size={18} />
          <span>{t.total}</span>
          <strong>{memberships.length}</strong>
        </article>
        <article>
          <CalendarDays size={18} />
          <span>{t.active}</span>
          <strong>{activeMemberships.length}</strong>
        </article>
        <article>
          <Gift size={18} />
          <span>{t.complimentary}</span>
          <strong>{availableBenefits.length}</strong>
        </article>
      </div>

      {memberships.length ? (
        <div className="membership-manager__list">
          <div className="membership-manager__head">
            <span>{t.customer}</span>
            <span>{t.term}</span>
            <span>{t.benefit}</span>
            <span>{t.status}</span>
          </div>
          {memberships.map((membership) => {
            const customer = customersById.get(membership.customer_id)
            const active =
              membership.status === 'active' &&
              new Date(membership.expires_at).getTime() > now
            const status = active
              ? t.active
              : membership.status === 'cancelled'
                ? t.cancelled
                : membership.status === 'refunded'
                  ? t.refunded
                  : t.expired

            return (
              <article key={membership.id}>
                <div>
                  <strong>{customer?.name ?? '—'}</strong>
                  <small>{customer?.email ?? '—'}</small>
                  {customer?.phone && <small>{customer.phone}</small>}
                  {membership.payment_environment === 'sandbox' && (
                    <em>{t.sandbox}</em>
                  )}
                </div>
                <span>
                  {formatDate(membership.starts_at)}
                  <small>{formatDate(membership.expires_at)}</small>
                </span>
                <span>
                  {membership.complimentary_service_code === 'pure-reset'
                    ? 'Pure Reset'
                    : 'Vital Glow'}
                  <small>
                    {membership.complimentary_redeemed_at
                      ? t.redeemed
                      : t.available}
                  </small>
                </span>
                <strong className={active ? 'is-active' : ''}>{status}</strong>
              </article>
            )
          })}
        </div>
      ) : (
        <p>{t.none}</p>
      )}
    </section>
  )
}
