import { CalendarDays, Home, Sparkles, type LucideIcon } from 'lucide-react'
import { siteHomePath } from '../lib/comingSoon'
import { localeHomePath, stripLocale } from '../lib/localeRouting'
import { copy } from '../localizedContent'
import { useSiteStore, type Locale } from '../store/useSiteStore'
import { BrandMark } from './BrandMark'

const mobileNavigationLabel: Record<Locale, string> = {
  zh: '移动端导航',
  'zh-TW': '行動版導覽',
  en: 'Mobile navigation',
  es: 'Navegación móvil',
  fr: 'Navigation mobile',
  ja: 'モバイルナビゲーション',
  ko: '모바일 탐색',
  de: 'Mobile Navigation',
  ru: 'Мобильная навигация',
}

export function Footer({ simple = false }: { simple?: boolean } = {}) {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale]
  const homePath = localeHomePath(locale, siteHomePath())
  const route = stripLocale(window.location.pathname)
  const onHome = route === '/' || route === '/preview'
  const sectionHref = (href: string) => (onHome ? href : `${homePath}${href}`)

  return (
    <footer className="footer">
      <div className="section-shell footer__inner">
        {/* 简化版：品牌标识回到站点根地址，且不展示完整站的栏目导航 */}
        <BrandMark light href={simple ? localeHomePath(locale, '/') : undefined} />
        <p>{t.footer.statement}</p>
        {!simple && (
          <div className="footer__links">
            {t.nav.map((item) => (
              <a href={sectionHref(item.href)} key={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        )}
        <small>{t.footer.rights}</small>
      </div>
    </footer>
  )
}

export function MobileTabBar() {
  const locale = useSiteStore((state) => state.locale)
  const activeSection = useSiteStore((state) => state.activeSection)
  const labels = copy[locale].mobile
  type TabItem = {
    id: string
    href: string
    label: string
    icon?: LucideIcon
  }
  const items: TabItem[] = [
    { id: 'home', href: '#home', label: labels.home, icon: Home },
    { id: 'services', href: '#services', label: labels.care },
    { id: 'space', href: '#space', label: labels.space, icon: Sparkles },
    { id: 'booking', href: '#booking', label: labels.booking, icon: CalendarDays },
  ]

  return (
    <nav
      className="mobile-tabbar"
      aria-label={mobileNavigationLabel[locale]}
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <a
            className={activeSection === item.id ? 'is-active' : ''}
            href={item.href}
            key={item.id}
            onClick={() => {
              if (item.id === 'booking') {
                window.dispatchEvent(new Event('ora:open-booking'))
              }
            }}
          >
            {Icon ? (
              <Icon size={19} strokeWidth={1.6} />
            ) : (
              <span className="tabbar-care-icon" aria-hidden="true" />
            )}
            <span>{item.label}</span>
          </a>
        )
      })}
    </nav>
  )
}
