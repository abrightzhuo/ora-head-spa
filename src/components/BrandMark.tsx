import { Leaf } from 'lucide-react'
import { copy } from '../localizedContent'
import { useSiteStore } from '../store/useSiteStore'

type BrandMarkProps = {
  light?: boolean
  compact?: boolean
  href?: string
}

export function BrandMark({
  light = false,
  compact = false,
  href = '#home',
}: BrandMarkProps) {
  const locale = useSiteStore((state) => state.locale)

  return (
    <a
      className={`brand-mark ${light ? 'brand-mark--light' : ''} ${compact ? 'brand-mark--compact' : ''}`}
      href={href}
      aria-label="ORA"
    >
      <span className="brand-mark__icon" aria-hidden="true">
        <Leaf size={compact ? 16 : 19} strokeWidth={1.4} />
      </span>
      <span className="brand-mark__name">ORA</span>
      {!compact && (
        <span className="brand-mark__line">{copy[locale].hero.eyebrow}</span>
      )}
    </a>
  )
}
