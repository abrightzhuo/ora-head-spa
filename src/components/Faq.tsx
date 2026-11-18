import { FAQ_ITEMS } from '../data/faq'
import { faqGraph } from '../data/structuredData'
import { useSiteStore, type Locale } from '../store/useSiteStore'
import { JsonLd } from './JsonLd'

type FaqCopy = {
  eyebrow: string
  title: string
  intro: string
}

const copy: Partial<Record<Locale, FaqCopy>> = {
  en: {
    eyebrow: 'Questions, answered',
    title: 'Head spa FAQ — Waltham, MA',
    intro:
      'The questions guests ask before their first ritual: what a head spa actually does, how often to come, what to prepare and what it costs.',
  },
  zh: {
    eyebrow: '常见问题',
    title: '头皮 SPA 常见问题 · 沃尔瑟姆',
    intro:
      '第一次到店前最常被问到的几件事：头皮 SPA 和洗头的区别、多久做一次、需要准备什么、价格区间。',
  },
  'zh-TW': {
    eyebrow: '常見問題',
    title: '頭皮 SPA 常見問題 · 沃爾瑟姆',
    intro:
      '第一次到店前最常被問到的幾件事：頭皮 SPA 和洗頭的區別、多久做一次、需要準備什麼、價格區間。',
  },
}

export function Faq() {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale] ?? copy.en
  const localized = locale === 'zh' || locale === 'zh-TW'

  return (
    <section className="faq section-shell" id="faq">
      <JsonLd
        data={faqGraph(FAQ_ITEMS, localized ? 'zh' : 'en')}
        id="faq-page"
      />
      <div className="faq__intro observe-reveal">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.title}</h2>
        <p>{t.intro}</p>
      </div>
      <div className="faq__list">
        {FAQ_ITEMS.map((item, index) => (
          <details className="faq__item" key={item.question}>
            <summary>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{localized ? item.questionZh : item.question}</h3>
            </summary>
            <div className="faq__answer">
              <p>{localized ? item.answerZh : item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
