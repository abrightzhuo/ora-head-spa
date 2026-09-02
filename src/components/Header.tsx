import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Globe2,
  Menu,
  UserRound,
  X,
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/customerAuth'
import { customerCopy } from '../customerCopy'
import { copy } from '../localizedContent'
import {
  localeLabels,
  locales,
  useSiteStore,
  type Locale,
} from '../store/useSiteStore'
import { BrandMark } from './BrandMark'

const giftCardLabel = {
  zh: '礼品卡',
  'zh-TW': '禮品卡',
  en: 'Gift Cards',
  es: 'Tarjetas regalo',
  fr: 'Cartes cadeaux',
  ja: 'ギフトカード',
  ko: '기프트 카드',
  de: 'Geschenkkarten',
  ru: 'Подарочные карты',
}

const membershipLabel: Record<Locale, string> = {
  zh: '年度会员',
  'zh-TW': '年度會員',
  en: 'Membership',
  es: 'Membresía',
  fr: 'Adhésion',
  ja: 'メンバーシップ',
  ko: '멤버십',
  de: 'Mitgliedschaft',
  ru: 'Членство',
}

const accessibilityCopy: Record<
  Locale,
  { language: string; navigation: string; openMenu: string; closeMenu: string }
> = {
  zh: { language: '语言', navigation: '主导航', openMenu: '打开菜单', closeMenu: '关闭菜单' },
  'zh-TW': { language: '語言', navigation: '主導覽', openMenu: '開啟選單', closeMenu: '關閉選單' },
  en: { language: 'Language', navigation: 'Main navigation', openMenu: 'Open menu', closeMenu: 'Close menu' },
  es: { language: 'Idioma', navigation: 'Navegación principal', openMenu: 'Abrir menú', closeMenu: 'Cerrar menú' },
  fr: { language: 'Langue', navigation: 'Navigation principale', openMenu: 'Ouvrir le menu', closeMenu: 'Fermer le menu' },
  ja: { language: '言語', navigation: 'メインナビゲーション', openMenu: 'メニューを開く', closeMenu: 'メニューを閉じる' },
  ko: { language: '언어', navigation: '주요 탐색', openMenu: '메뉴 열기', closeMenu: '메뉴 닫기' },
  de: { language: 'Sprache', navigation: 'Hauptnavigation', openMenu: 'Menü öffnen', closeMenu: 'Menü schließen' },
  ru: { language: 'Язык', navigation: 'Основная навигация', openMenu: 'Открыть меню', closeMenu: 'Закрыть меню' },
}

type HeaderProps = {
  actionHref?: string
  actionLabel?: string
  returnToHome?: boolean
}

function LanguageSwitch() {
  const { locale, setLocale } = useSiteStore()
  const [open, setOpen] = useState(false)
  const labels = accessibilityCopy[locale]

  return (
    <div className={`language-switch ${open ? 'is-open' : ''}`}>
      <button
        className="language-switch__trigger"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe2 size={14} />
        <span>{localeLabels[locale]}</span>
        <ChevronDown size={13} />
      </button>
      <div
        className="language-switch__menu"
        role="listbox"
        aria-label={labels.language}
      >
        {locales.map((item) => (
          <button
            className={locale === item ? 'is-active' : ''}
            key={item}
            onClick={() => {
              setLocale(item)
              setOpen(false)
            }}
            type="button"
            role="option"
            aria-selected={locale === item}
          >
            <span>{localeLabels[item]}</span>
            {locale === item && <Check size={14} />}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Header({
  actionHref = '#booking',
  actionLabel,
  returnToHome = false,
}: HeaderProps = {}) {
  const locale = useSiteStore((state) => state.locale)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const t = copy[locale]
  const customer = customerCopy[locale]
  const accessibility = accessibilityCopy[locale]
  const { user, openAuth } = useCustomerAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)
  const homeHref = returnToHome ? `/?lang=${locale}` : '#home'
  const sectionHref = (href: string) =>
    returnToHome ? `/?lang=${locale}${href}` : href
  const openBooking = () => {
    if (!returnToHome) {
      window.dispatchEvent(new Event('ora:open-booking'))
    }
  }

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="site-header__inner">
        <BrandMark compact href={homeHref} />
        <nav
          className="desktop-nav"
          aria-label={accessibility.navigation}
        >
          {t.nav.map((item) => (
            <a href={sectionHref(item.href)} key={item.href}>
              {item.label}
            </a>
          ))}
            <a href={`/gift-cards?lang=${locale}`}>
              {giftCardLabel[locale]}
            </a>
              <a href={`/membership?lang=${locale}`}>
                {membershipLabel[locale]}
              </a>
        </nav>
        <div className="site-header__actions">
          <LanguageSwitch />
          {user ? (
            <a
              className="customer-account-link"
              href={`/account?lang=${locale}`}
              aria-label={customer.account}
              title={customer.account}
            >
              <UserRound size={17} />
            </a>
          ) : (
            <button
              className="customer-account-link"
              type="button"
              onClick={() => openAuth('sign-in')}
              aria-label={customer.signIn}
              title={customer.signIn}
            >
              <UserRound size={17} />
            </button>
          )}
          <a
            className="header-book"
              href={actionHref}
              onClick={openBooking}
          >
              {actionLabel ?? t.book}
            <ArrowUpRight size={15} />
          </a>
          <button
            className="menu-button"
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label={
              menuOpen
                ? accessibility.closeMenu
                : accessibility.openMenu
            }
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}>
        <div className="mobile-menu__content">
          <p>ORA / {t.hero.explore}</p>
          {t.nav.map((item, index) => (
              <a
                href={sectionHref(item.href)}
                key={item.href}
                onClick={closeMenu}
              >
              <span>0{index + 1}</span>
              {item.label}
            </a>
          ))}
            <a href={`/gift-cards?lang=${locale}`} onClick={closeMenu}>
              <span>05</span>
              {giftCardLabel[locale]}
            </a>
              <a href={`/membership?lang=${locale}`} onClick={closeMenu}>
                <span>06</span>
                {membershipLabel[locale]}
              </a>
          {user ? (
            <a href={`/account?lang=${locale}`} onClick={closeMenu}>
                <span>07</span>
              {customer.account}
            </a>
          ) : (
            <button
              className="mobile-menu__account"
              type="button"
              onClick={() => {
                closeMenu()
                openAuth('sign-in')
              }}
            >
                <span>07</span>
              {customer.signIn}
            </button>
          )}
          <a
            className="mobile-menu__book"
              href={actionHref}
            onClick={() => {
                openBooking()
              closeMenu()
            }}
          >
              {actionLabel ?? t.book}
            <ArrowUpRight />
          </a>
        </div>
      </div>
    </header>
  )
}
