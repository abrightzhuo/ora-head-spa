import { BRAND_FACTS, SERVICE_FACTS } from '../data/business'
import { useSiteStore, type Locale } from '../store/useSiteStore'

type FactsCopy = {
  eyebrow: string
  title: string
  lead: string
}

const copy: Partial<Record<Locale, FactsCopy>> = {
  en: {
    eyebrow: 'Brand facts',
    title: 'ORA at a glance',
    lead: 'ORA Head Spa & Wellness is the Waltham, Massachusetts head spa of TOUCHEER, a herbal scalp care brand founded in 1998. Rituals run 60 to 90 minutes, one therapist to one guest, with prices from $169 to $189.',
  },
  zh: {
    eyebrow: '品牌事实',
    title: '关于 ORA，几个可核对的事实',
    lead: 'ORA Head Spa & Wellness 是草本头皮养护品牌 TOUCHEER 在麻萨诸塞州 Waltham 的头疗空间，品牌创立于 1998 年。单次护理 60 到 90 分钟，一对一服务，价格 $169 起。',
  },
  'zh-TW': {
    eyebrow: '品牌事實',
    title: '關於 ORA，幾個可核對的事實',
    lead: 'ORA Head Spa & Wellness 是草本頭皮養護品牌 TOUCHEER 在麻薩諸塞州 Waltham 的頭療空間，品牌創立於 1998 年。單次護理 60 到 90 分鐘，一對一服務，價格 $169 起。',
  },
}

export function BrandFacts() {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale] ?? copy.en
  const localized = locale === 'zh' || locale === 'zh-TW'

  return (
    <section className="brand-facts section-shell" id="facts">
      <div className="brand-facts__intro observe-reveal">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.title}</h2>
        <p className="brand-facts__lead">{t.lead}</p>
      </div>
      <dl className="brand-facts__grid">
        {BRAND_FACTS.map((fact) => (
          <div key={fact.value + fact.label}>
            <dt>{fact.value}</dt>
            <dd>{localized ? fact.labelZh : fact.label}</dd>
          </div>
        ))}
      </dl>
      <ul className="brand-facts__prices">
        {SERVICE_FACTS.map((service) => (
          <li key={service.code}>
            <strong>{service.name}</strong>
            <span>
              {service.durationMinutes} min · ${service.price.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
