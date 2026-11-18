import { ArrowUpRight, Check, Eye, Flower2, Hand, MessageCircle, Sparkles } from 'lucide-react'
import { SERVICE_FACTS } from '../data/business'
import { useBookingCatalog } from '../hooks/useBookingCatalog'
import { useMembershipPricing } from '../hooks/useMembershipPricing'
import { copy } from '../localizedContent'
import { useSiteStore, type Locale } from '../store/useSiteStore'

const ritualIcons = [MessageCircle, Eye, Flower2, Hand, Sparkles]

const priceTableCopy: Partial<
  Record<Locale, { title: string; ritual: string; duration: string; price: string; note: string }>
> = {
  en: {
    title: 'Rituals and prices',
    ritual: 'Ritual',
    duration: 'Duration',
    price: 'Price',
    note: 'All rituals are one-to-one and include the scalp check, botanical cleanse and quiet rest. Prices in USD.',
  },
  zh: {
    title: '项目与价格',
    ritual: '项目',
    duration: '时长',
    price: '价格',
    note: '所有项目均为一对一服务，含头皮观察、草本清洁与静养环节。价格以美元计。',
  },
  'zh-TW': {
    title: '項目與價格',
    ritual: '項目',
    duration: '時長',
    price: '價格',
    note: '所有項目均為一對一服務，含頭皮觀察、草本清潔與靜養環節。價格以美元計。',
  },
}

export function Services() {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale].services
  const serviceCodes = ['pure-reset', 'vital-glow', 'deep-stillness']
  const { catalog } = useBookingCatalog()
  const { servicePrice } = useMembershipPricing()
  const labels = priceTableCopy[locale] ?? priceTableCopy.en!
  const localizedFacts = locale === 'zh' || locale === 'zh-TW'
  const localizedName = (index: number, fallback: string) => {
    const fact = SERVICE_FACTS[index]
    if (!fact) return fallback
    if (locale === 'zh') return fact.nameZh
    if (locale === 'zh-TW') return fact.nameZhTw
    return fact.name
  }

  const selectService = (code: string) => {
    window.dispatchEvent(new CustomEvent('ora:select-service', { detail: code }))
    document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="services" id="services">
      <div className="section-shell">
        <div className="services__heading observe-reveal">
          <div>
            <p className="eyebrow eyebrow--light">{t.eyebrow}</p>
            <h2>{t.title}</h2>
          </div>
          <p>{t.intro}</p>
        </div>
        <div className="service-grid">
          {t.items.map((service, index) => {
            const serviceCode = serviceCodes[index] ?? ''
            const liveService = catalog?.services.find(
              (item) => item.code === serviceCode,
            )
            const fact = SERVICE_FACTS[index]
            // 可摘引首段：英文 / 简中 / 繁中走统一模板，其余语言沿用已翻译的文案
            const description =
              locale === 'en'
                ? fact?.summary
                : locale === 'zh'
                  ? fact?.summaryZh
                  : locale === 'zh-TW'
                    ? fact?.summaryZhTw
                    : service.description

            return (
              <article
                className={`service-card service-card--${index + 1}`}
                key={service.number}
              >
                <div className="service-card__number">{service.number}</div>
                <div className="service-card__title">
                  {service.english && <p>{service.english}</p>}
                  <h3>{service.title}</h3>
                </div>
                <p className="service-card__description">{description}</p>
                <ul>
                  {service.highlights.map((item) => (
                    <li key={item}>
                      <Check size={14} />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="service-card__footer">
                  <span>
                    {service.duration}
                    {liveService
                      ? ` · $${(servicePrice(liveService) / 100).toFixed(2)}`
                      : fact
                        ? ` · $${fact.price.toFixed(2)}`
                        : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => selectService(serviceCode)}
                    aria-label={`${t.choose}: ${service.title}`}
                  >
                    <span>{t.choose}</span>
                    <ArrowUpRight />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
        {/* 价格必须以文字呈现：图片里的价格 AI 读不到 */}
        <div className="price-table observe-reveal">
          <h3>{labels.title}</h3>
          <table>
            <thead>
              <tr>
                <th scope="col">{labels.ritual}</th>
                <th scope="col">{labels.duration}</th>
                <th scope="col">{labels.price}</th>
              </tr>
            </thead>
            <tbody>
              {SERVICE_FACTS.map((fact, index) => (
                <tr key={fact.code}>
                  <th scope="row">{localizedName(index, fact.name)}</th>
                  <td>
                    {fact.durationMinutes} {localizedFacts ? '分钟' : 'min'}
                  </td>
                  <td>${fact.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="price-table__note">{labels.note}</p>
        </div>
      </div>
    </section>
  )
}

export function Ritual() {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale].ritual

  return (
    <section className="ritual section-shell">
      <div className="ritual__heading observe-reveal">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.title}</h2>
      </div>
      <div className="ritual-track">
        <div className="ritual-track__line" />
        {t.steps.map((step, index) => {
          const Icon = ritualIcons[index]
          return (
            <article className="ritual-step" key={index}>
              <div className="ritual-step__icon">
                <Icon size={22} strokeWidth={1.2} />
              </div>
              <span>0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
