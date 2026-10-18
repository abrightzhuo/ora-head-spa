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
  const base = '/images/ora-logo'

  return (
    <a
      className={`brand-mark ${light ? 'brand-mark--light' : ''} ${compact ? 'brand-mark--compact' : ''}`}
      href={href}
      aria-label="ORA Head Spa & Wellness"
    >
      <img
        className="brand-mark__img brand-mark__img--color"
        src={`${base}.png`}
        alt="ORA Head Spa & Wellness"
      />
      <img
        className="brand-mark__img brand-mark__img--light"
        src={`${base}-light.png`}
        alt=""
        aria-hidden="true"
      />
    </a>
  )
}
