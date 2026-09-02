import { create } from 'zustand'

export const locales = ['zh', 'zh-TW', 'en', 'es', 'fr', 'ja', 'ko', 'de', 'ru'] as const
export type Locale = (typeof locales)[number]

export const localeLabels: Record<Locale, string> = {
  zh: '简体中文',
  'zh-TW': '繁體中文',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ja: '日本語',
  ko: '한국어',
  de: 'Deutsch',
  ru: 'Русский',
}

const htmlLang: Record<Locale, string> = {
  zh: 'zh-CN',
  'zh-TW': 'zh-TW',
  en: 'en',
  es: 'es',
  fr: 'fr',
  ja: 'ja',
  ko: 'ko',
  de: 'de',
  ru: 'ru',
}

const isLocale = (value: string | null): value is Locale =>
  locales.includes(value as Locale)

type SiteState = {
  locale: Locale
  activeSection: string
  setLocale: (locale: Locale) => void
  setActiveSection: (section: string) => void
}

const getInitialLocale = (): Locale => {
  const queryLocale = new URLSearchParams(window.location.search).get('lang')
  if (isLocale(queryLocale)) return queryLocale

  return 'en'
}

const initialLocale = getInitialLocale()
document.documentElement.lang = htmlLang[initialLocale]

export const useSiteStore = create<SiteState>((set) => ({
  locale: initialLocale,
  activeSection: 'home',
  setLocale: (locale) => {
    sessionStorage.setItem('ora-locale', locale)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', locale)
    window.history.replaceState({}, '', url)
    document.documentElement.lang = htmlLang[locale]
    set({ locale })
  },
  setActiveSection: (activeSection) => set({ activeSection }),
}))
