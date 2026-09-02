import { ArrowDown, Asterisk, Droplets, Flower2, ScanFace, Wind } from 'lucide-react'
import { images } from '../content'
import { copy } from '../localizedContent'
import { useSiteStore } from '../store/useSiteStore'

const valueIcons = [Flower2, ScanFace, Wind, Droplets]

export function Hero() {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale].hero

  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <img className="hero__image" src={images.storefront} alt={t.eyebrow} />
      <div className="hero__veil" />
      <div className="hero__content">
        <div className="hero__eyebrow reveal-up">
          <Asterisk size={13} />
          {t.eyebrow}
        </div>
        <h1 id="hero-title" className="reveal-up delay-1">
          <span>{t.title}</span>
          <em>{t.italic}</em>
        </h1>
        <p className="hero__description reveal-up delay-2">{t.description}</p>
        <div className="hero__actions reveal-up delay-3">
          <a
            className="button button--gold"
            href="#booking"
            onClick={() => window.dispatchEvent(new Event('ora:open-booking'))}
          >
            {copy[locale].book}
          </a>
          <a className="text-link text-link--light" href="#services">
            {t.explore}
            <ArrowDown size={16} />
          </a>
        </div>
      </div>
      <div className="hero__side-note">{t.note}</div>
    </section>
  )
}

export function Philosophy() {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale].philosophy

  return (
    <section className="philosophy section-shell" id="philosophy">
      <div className="botanical-orbit botanical-orbit--one" aria-hidden="true" />
      <div className="section-index">01</div>
      <div className="philosophy__intro observe-reveal">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.title}</h2>
      </div>
      <div className="philosophy__body observe-reveal">
        <p>{t.body}</p>
        <div className="philosophy__mark">
          <Flower2 strokeWidth={1} />
          <span>ORA</span>
        </div>
      </div>
      <div className="value-grid">
        {t.values.map((value, index) => {
          const Icon = valueIcons[index]
          return (
            <article className="value-card" key={index}>
              <div className="value-card__top">
                <Icon size={26} strokeWidth={1.2} />
                <span>0{index + 1}</span>
              </div>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
