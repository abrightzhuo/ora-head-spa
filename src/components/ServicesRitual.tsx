import { ArrowUpRight, Check, Eye, Flower2, Hand, MessageCircle, Sparkles } from 'lucide-react'
import { useBookingCatalog } from '../hooks/useBookingCatalog'
import { useMembershipPricing } from '../hooks/useMembershipPricing'
import { copy } from '../localizedContent'
import { useSiteStore } from '../store/useSiteStore'

const ritualIcons = [MessageCircle, Eye, Flower2, Hand, Sparkles]

export function Services() {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale].services
  const serviceCodes = ['pure-reset', 'vital-glow', 'deep-stillness']
  const { catalog } = useBookingCatalog()
  const { servicePrice } = useMembershipPricing()

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
                <p className="service-card__description">{service.description}</p>
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
                    {liveService &&
                      ` · $${(servicePrice(liveService) / 100).toFixed(2)}`}
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
