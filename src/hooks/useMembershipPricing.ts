import { useCustomerAuth } from '../contexts/customerAuth'
import { easternDateKey } from '../lib/dateTime'

type PricedService = {
  code: string
  price_cents: number
}

function weekdayFor(value?: string) {
  if (!value) return null
  if (!value.includes('T')) {
    return new Date(`${value}T12:00:00Z`).getUTCDay()
  }
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  }).format(new Date(value))
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday)
}

export function useMembershipPricing() {
  const { membership, membershipLoading } = useCustomerAuth()

  const appliesOn = (value?: string) => {
    if (!membership || membership.status !== 'active') return false
    const dateKey = value
      ? value.includes('T')
        ? easternDateKey(value)
        : value
      : easternDateKey()
    return (
      dateKey >= easternDateKey(membership.starts_at) &&
      dateKey <= easternDateKey(membership.expires_at)
    )
  }

  const serviceDiscountBps = (value?: string) => {
    if (!appliesOn(value)) return 0
    const weekday = weekdayFor(value)
    return weekday !== null && weekday >= 1 && weekday <= 4 ? 2000 : 1000
  }

  const servicePrice = (service: PricedService, value?: string) => {
    if (!appliesOn(value)) return service.price_cents
    if (
      !membership?.complimentary_redeemed_at &&
      membership?.complimentary_service_code === service.code
    ) {
      return 0
    }
    return Math.round(
      service.price_cents * (1 - serviceDiscountBps(value) / 10000),
    )
  }

  const productPrice = (priceCents: number) =>
    appliesOn() ? Math.round(priceCents * 0.8) : priceCents

  return {
    membership,
    membershipLoading,
    isMember: appliesOn(),
    appliesOn,
    serviceDiscountBps,
    servicePrice,
    productPrice,
  }
}
