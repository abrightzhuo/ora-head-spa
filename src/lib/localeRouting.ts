import { siteHomePath } from './comingSoon'
import { locales, type Locale } from './locales'

/**
 * 语言路径化（P3）：每种语言一个独立可索引的 URL，而不是 ?lang= 查询参数。
 *
 *   en     /preview        /about        /gift-cards        /membership
 *   es     /es             /es/about     /es/gift-cards     /es/membership
 *   zh-TW  /zh-tw          /zh-tw/about  ...
 */
export const LOCALE_SLUGS: Record<Locale, string> = {
  en: '',
  zh: 'zh',
  'zh-TW': 'zh-tw',
  es: 'es',
  fr: 'fr',
  ja: 'ja',
  ko: 'ko',
  de: 'de',
  ru: 'ru',
}

/** hreflang 取值与路径 slug 不一定相同（zh-CN / zh-TW） */
export const HREFLANG: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-CN',
  'zh-TW': 'zh-TW',
  es: 'es',
  fr: 'fr',
  ja: 'ja',
  ko: 'ko',
  de: 'de',
  ru: 'ru',
}

/** 需要做语言索引的公开页面（与 prerender 的 ROUTES 对齐） */
export const PUBLIC_ROUTES = [
  '/preview',
  '/about',
  '/gift-cards',
  '/membership',
  '/forum',
] as const
export type PublicRoute = (typeof PUBLIC_ROUTES)[number]

const slugToLocale = new Map<string, Locale>(
  locales
    .filter((locale) => LOCALE_SLUGS[locale])
    .map((locale) => [LOCALE_SLUGS[locale], locale]),
)

/** 从 pathname 判断语言，未带前缀时回落到英文 */
export function localeFromPath(pathname: string): Locale | null {
  const slug = pathname.split('/')[1]?.toLowerCase()
  if (!slug) return null
  return slugToLocale.get(slug) ?? null
}

/** 去掉语言前缀，得到站内路由（/es/about -> /about，/es -> /） */
export function stripLocale(pathname: string): string {
  const locale = localeFromPath(pathname)
  if (!locale) return pathname
  const slug = LOCALE_SLUGS[locale]
  const rest = pathname.slice(slug.length + 1)
  return rest || '/'
}

/**
 * 站内跳转用的当前语言首页。
 * 英文回落到 enHome（coming-soon 期间是 /preview，正式站是 /），其它语言用前缀。
 * 与 localePath 的区别：localePath 是给 canonical / sitemap 用的规范地址。
 */
export function localeHomePath(locale: Locale, enHome = '/'): string {
  const slug = LOCALE_SLUGS[locale]
  return slug ? `/${slug}` : enHome
}

/**
 * 路由 -> pathname。
 * 首页统一用 /preview（英文）或 /<slug>（其它语言），保证 canonical 与 sitemap 一致。
 */
export function localePath(locale: Locale, path: string): string {
  const slug = LOCALE_SLUGS[locale]
  const isHome = path === '/' || path === '/preview'
  if (!slug) return isHome ? '/preview' : path
  return isHome ? `/${slug}` : `/${slug}${path}`
}

export function isPublicRoute(path: string): path is PublicRoute {
  return (PUBLIC_ROUTES as readonly string[]).includes(path)
}

/** 当前页面在 9 种语言下的地址 + x-default */
export function alternateLinks(
  route: PublicRoute,
  origin: string,
): { hreflang: string; href: string }[] {
  const links = locales.map((locale) => ({
    hreflang: HREFLANG[locale],
    href: `${origin}${localePath(locale, route)}`,
  }))
  links.push({ hreflang: 'x-default', href: `${origin}${localePath('en', route)}` })
  return links
}

/** 语言切换器：把当前页面切到另一种语言，返回可直接 pushState 的地址 */
export function switchLocalePath(locale: Locale, pathname: string, search = ''): string {
  const route = stripLocale(pathname)
  const slug = LOCALE_SLUGS[locale]

  // 首页：其它语言统一为 /<slug>；英文回到当前站点的首页形态（coming-soon 期间是 /preview）
  if (route === '/' || route === '/preview') {
    if (slug) return `/${slug}`
    return route === '/preview' ? '/preview' : siteHomePath()
  }

  if (!(PUBLIC_ROUTES as readonly string[]).includes(route)) {
    // 非公开页（account / providers / admin）仍用查询参数，并保留原有其他参数
    const params = new URLSearchParams(search)
    params.set('lang', locale)
    return `${pathname}?${params.toString()}`
  }

  return localePath(locale, route)
}
