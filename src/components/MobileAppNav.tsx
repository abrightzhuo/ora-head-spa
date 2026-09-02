import {
  CalendarDays,
  Gift,
  Home,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useSiteStore, type Locale } from '../store/useSiteStore'

const labels: Record<
  Locale,
  {
    home: string
    book: string
    membership: string
    gift: string
    account: string
  }
> = {
  zh: { home: '首页', book: '预约', membership: '会员', gift: '礼品卡', account: '账户' },
  'zh-TW': { home: '首頁', book: '預約', membership: '會員', gift: '禮品卡', account: '帳戶' },
  en: { home: 'Home', book: 'Book', membership: 'Member', gift: 'Gift', account: 'Account' },
  es: { home: 'Inicio', book: 'Reservar', membership: 'Membresía', gift: 'Regalo', account: 'Cuenta' },
  fr: { home: 'Accueil', book: 'Réserver', membership: 'Adhésion', gift: 'Cadeau', account: 'Compte' },
  ja: { home: 'ホーム', book: '予約', membership: '会員', gift: 'ギフト', account: 'アカウント' },
  ko: { home: '홈', book: '예약', membership: '멤버십', gift: '선물', account: '계정' },
  de: { home: 'Start', book: 'Buchen', membership: 'Mitglied', gift: 'Geschenk', account: 'Konto' },
  ru: { home: 'Главная', book: 'Запись', membership: 'Клуб', gift: 'Подарок', account: 'Аккаунт' },
}

export function MobileAppNav() {
  const locale = useSiteStore((state) => state.locale)
  const t = labels[locale]
  const path = window.location.pathname
  const hash = window.location.hash
  const localeQuery = `lang=${encodeURIComponent(locale)}`
  const items = [
    {
      href: `/?${localeQuery}`,
      label: t.home,
      icon: Home,
      active: path === '/' && hash !== '#booking',
    },
    {
      href: `/?${localeQuery}#booking`,
      label: t.book,
      icon: CalendarDays,
      active: path === '/' && hash === '#booking',
    },
    {
      href: `/membership?${localeQuery}`,
      label: t.membership,
      icon: Sparkles,
      active: path === '/membership',
    },
    {
      href: `/gift-cards?${localeQuery}`,
      label: t.gift,
      icon: Gift,
      active: path === '/gift-cards',
    },
    {
      href: `/account?${localeQuery}`,
      label: t.account,
      icon: UserRound,
      active: path === '/account',
    },
  ]

  return (
    <nav className="mobile-app-nav" aria-label="App navigation">
      {items.map(({ href, label, icon: Icon, active }) => (
        <a
          className={active ? 'is-active' : ''}
          href={href}
          key={href}
          aria-current={active ? 'page' : undefined}
        >
          <Icon size={21} strokeWidth={active ? 2 : 1.7} />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  )
}
