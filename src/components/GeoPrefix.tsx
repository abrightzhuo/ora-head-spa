import { useSiteStore, type Locale } from '../store/useSiteStore'

/**
 * 给每个页面的唯一 H1 补上地域限定（"Head Spa in Waltham, MA"）。
 * 视觉上不占位，但会出现在 DOM / 预渲染 HTML 与读屏文本里。
 */
const prefix: Record<Locale, string> = {
  en: 'Head Spa in Waltham, MA — ',
  zh: 'Waltham 草本头疗 SPA — ',
  'zh-TW': 'Waltham 草本頭療 SPA — ',
  es: 'Spa capilar en Waltham, MA — ',
  fr: 'Spa capillaire à Waltham, MA — ',
  ja: 'ウォルサムのヘッドスパ — ',
  ko: '월섬 헤드 스파 — ',
  de: 'Kopfhautspa in Waltham, MA — ',
  ru: 'СПА для кожи головы в Уолтеме, Массачусетс — ',
}

export function GeoPrefix() {
  const locale = useSiteStore((state) => state.locale)
  return <span className="sr-only">{prefix[locale]}</span>
}
