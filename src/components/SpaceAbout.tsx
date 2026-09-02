import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Quote } from 'lucide-react'
import { images } from '../content'
import { copy } from '../localizedContent'
import { useSiteStore, type Locale } from '../store/useSiteStore'

const testimonialControls: Record<
  Locale,
  { previous: string; next: string }
> = {
  zh: { previous: '上一条顾客心声', next: '下一条顾客心声' },
  'zh-TW': { previous: '上一則顧客心聲', next: '下一則顧客心聲' },
  en: { previous: 'Previous guest note', next: 'Next guest note' },
  es: { previous: 'Comentario anterior', next: 'Comentario siguiente' },
  fr: { previous: 'Témoignage précédent', next: 'Témoignage suivant' },
  ja: { previous: '前のお客様の声', next: '次のお客様の声' },
  ko: { previous: '이전 고객 이야기', next: '다음 고객 이야기' },
  de: { previous: 'Vorherige Gästestimme', next: 'Nächste Gästestimme' },
  ru: { previous: 'Предыдущий отзыв', next: 'Следующий отзыв' },
}

export function SpaceGallery() {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale].space

  return (
    <section className="space-section" id="space">
      <div className="section-shell">
        <div className="space-section__heading observe-reveal">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h2>{t.title}</h2>
          </div>
          <p>{t.body}</p>
        </div>
        <div className="space-gallery">
          <figure className="space-photo space-photo--main observe-reveal">
            <img src={images.interiorHall} alt={t.hall} loading="lazy" />
            <figcaption>
              <span>01</span>
              {t.hall}
            </figcaption>
          </figure>
          <figure className="space-photo space-photo--secondary observe-reveal">
            <img src={images.interiorLounge} alt={t.lounge} loading="lazy" />
            <figcaption>
              <span>02</span>
              {t.lounge}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}

export function About() {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale].about

  return (
    <section className="about section-shell" id="about">
      <div className="about__visual observe-reveal">
        <div className="about__image-wrap">
          <img
            src={images.logo}
            alt={copy[locale].hero.eyebrow}
            loading="lazy"
          />
        </div>
        <div className="about__image-ring" aria-hidden="true" />
      </div>
      <div className="about__content observe-reveal">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.title}</h2>
        <p className="about__body">{t.body}</p>
        <blockquote>{t.quote}</blockquote>
        <div className="about__stats">
          {t.stats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Testimonials() {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale].testimonial
  const controls = testimonialControls[locale]
  const [active, setActive] = useState(0)

  useEffect(() => setActive(0), [locale])

  const showPrevious = () => setActive((value) => (value - 1 + t.quotes.length) % t.quotes.length)
  const showNext = () => setActive((value) => (value + 1) % t.quotes.length)
  const quote = t.quotes[active]

  return (
    <section className="testimonials">
      <div className="section-shell testimonials__inner observe-reveal">
        <div className="testimonials__heading">
          <p className="eyebrow eyebrow--light">{t.eyebrow}</p>
          <h2>{t.title}</h2>
        </div>
        <div className="testimonial-card" aria-live="polite">
          <Quote className="testimonial-card__quote" size={40} strokeWidth={1} />
          <blockquote>{quote.text}</blockquote>
          <div className="testimonial-card__person">
            <div>
              <strong>{quote.name}</strong>
              <span>{quote.detail}</span>
            </div>
            <div className="testimonial-card__controls">
              <button
                type="button"
                onClick={showPrevious}
                aria-label={controls.previous}
              >
                <ArrowLeft />
              </button>
              <span>{String(active + 1).padStart(2, '0')} / {String(t.quotes.length).padStart(2, '0')}</span>
              <button
                type="button"
                onClick={showNext}
                aria-label={controls.next}
              >
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
