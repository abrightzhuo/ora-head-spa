import { create } from 'zustand'
import { htmlLang, isLocale, type Locale } from '../lib/locales'
import { localeFromPath, switchLocalePath } from '../lib/localeRouting'

export { locales, localeLabels, type Locale } from '../lib/locales'

type SiteState = {
  locale: Locale
  activeSection: string
  setLocale: (locale: Locale) => void
  setActiveSection: (activeSection: string) => void
}

/**
 * 语言来源优先级（URL 是唯一事实来源，不再记忆其它状态）：
 * 1. URL 路径前缀（/es/about、/zh-tw）—— P3 之后的规范形式
 * 2. ?lang= 查询参数 —— 兼容旧链接与非公开页（account / providers / admin）
 * 3. 英文
 */
function localeFromUrl(): Locale {
  const fromPath = localeFromPath(window.location.pathname)
  if (fromPath) return fromPath

  const queryLocale = new URLSearchParams(window.location.search).get('lang')
  if (isLocale(queryLocale)) return queryLocale

  return 'en'
}

const initialLocale = localeFromUrl()
document.documentElement.lang = htmlLang[initialLocale]

export const useSiteStore = create<SiteState>((set) => ({
  locale: initialLocale,
  activeSection: 'home',
  setLocale: (locale) => {
    document.documentElement.lang = htmlLang[locale]

    // 公开页切换到对应语言的独立路径；其它页面保留查询参数
    const { pathname, search, hash } = window.location
    const nextPath = switchLocalePath(locale, pathname, search)
    if (nextPath !== `${pathname}${search}`) {
      // 用 pushState 而不是 location.assign，避免整页刷新丢失 SPA 状态
      window.history.pushState({}, '', `${nextPath}${hash}`)
    }

    set({ locale })
  },
  setActiveSection: (activeSection) => set({ activeSection }),
}))

/**
 * 前进 / 后退只改变了 URL，不会触发 React 重新渲染，
 * 因此在这里把 URL 上的语言同步回 store（页面路径由 App 的 popstate 监听处理）。
 */
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const next = localeFromUrl()
    if (next === useSiteStore.getState().locale) return
    document.documentElement.lang = htmlLang[next]
    useSiteStore.setState({ locale: next })
  })
}
