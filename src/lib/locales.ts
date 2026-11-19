/**
 * 语言清单与 html lang 映射。
 * 单独成模块，避免 store 与路由工具互相 import 造成循环依赖。
 */
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

export const htmlLang: Record<Locale, string> = {
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

export const isLocale = (value: string | null): value is Locale =>
  locales.includes(value as Locale)
