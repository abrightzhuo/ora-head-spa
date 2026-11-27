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
      {/* 声明固有尺寸，CSS 只覆盖显示高度；图片加载前即可预留宽度，避免宽度从 0 跳到实际值 */}
      <img
        className="brand-mark__img brand-mark__img--color"
        src={`${base}.png`}
        alt="ORA Head Spa & Wellness"
        width={700}
        height={270}
      />
      <img
        className="brand-mark__img brand-mark__img--light"
        src={`${base}-light.png`}
        alt=""
        aria-hidden="true"
        width={700}
        height={270}
      />
    </a>
  )
}
