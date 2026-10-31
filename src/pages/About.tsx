import { useEffect } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Footer } from '../components/FooterMobile'
import { Header } from '../components/Header'
import { isComingSoon } from '../lib/comingSoon'
import { useSiteStore, type Locale } from '../store/useSiteStore'

type Chapter = {
  eyebrow: string
  title: string
  body: string[]
  stats?: { value: string; label: string }[]
}

type AboutCopy = {
  hero: {
    eyebrow: string
    title: string
    subtitle: string
  }
  chapters: Chapter[]
  closing: {
    eyebrow: string
    title: string
    body: string
    cta: string
    imageAlt: string
  }
}

const chapterMedia = [
  {
    image: '/images/about/miao-village.jpg',
    alt: {
      en: 'Miao village nestled among forested mountains',
      zh: '群山环抱中的苗寨',
      'zh-TW': '群山環抱中的苗寨',
    },
  },
  {
    image: '/images/interior-02.jpg',
    alt: {
      en: 'Herbal ingredients displayed along the ORA corridor',
      zh: 'ORA 走廊中陈列的草本',
      'zh-TW': 'ORA 走廊中陳列的草本',
    },
  },
  {
    image: '/images/storefront.jpg',
    alt: {
      en: 'ORA Toucheer head spa storefront in Waltham',
      zh: '位于 Waltham 的 ORA Toucheer 门店',
      'zh-TW': '位於 Waltham 的 ORA Toucheer 門店',
    },
  },
  {
    image: '/images/interior-01.jpg',
    alt: {
      en: 'The ORA head spa treatment space in Waltham',
      zh: 'ORA 位于 Waltham 的头疗空间',
      'zh-TW': 'ORA 位於 Waltham 的頭療空間',
    },
  },
]

const english: AboutCopy = {
  hero: {
    eyebrow: 'ORA Toucheer · Waltham, Massachusetts',
    title: 'Our Story',
    subtitle:
      'A heritage of herbal care, carried from the mountains of Guizhou to Waltham — the story behind every ritual at ORA.',
  },
  chapters: [
    {
      eyebrow: 'Our Heritage',
      title: 'Rooted in Herbal Traditions',
      body: [
        'The inspiration for herbal hair care and body wellness comes from the rich herbal culture passed down through generations of the Miao people.',
        'For hundreds of years, herbal wisdom has been deeply woven into the daily lives of the Miao people, from their traditional use of mountain herbs and plants to their time-honored practices of caring for the hair, body, and mind. This enduring heritage has shaped a way of life that respects nature and values health, beauty, and overall well-being.',
      ],
    },
    {
      eyebrow: 'The Art of Herbal Care',
      title: 'Selected. Blended. Prepared.',
      body: [
        'We believe that everything in nature carries its own unique energy, deeply connected to our bodies and well-being. Through the gifts of nature, we find balance, restore our energy, and nurture a healthier way of life.',
        'Our herbal philosophy begins with carefully selected, high-quality botanicals, thoughtfully blended and prepared using time-honored traditional methods. Slowly simmered over gentle heat for dozens of hours, these precious herbs gradually release their natural essence, creating three signature herbal infusions that bring the wisdom and vitality of nature into every head spa experience.',
      ],
    },
    {
      eyebrow: 'Our Brand Journey',
      title: 'A Tradition That Continues',
      body: [
        'Established in 1998, TOUCHEER has grown and flourished over the decades, expanding to more than 10,000 locations across China and extending its presence internationally to countries including Singapore, the United States, Canada, Malaysia, and beyond. Through the wisdom of botanical wellness, TOUCHEER brings people around the world a more relaxed, balanced, and healthier way of life.',
        'Today, I am proud to bring this time-honored herbal care tradition to Waltham, Massachusetts, through ORA.',
      ],
      stats: [
        { value: '1998', label: 'Established' },
        { value: '10,000+', label: 'Locations' },
        { value: '5+', label: 'Countries' },
      ],
    },
    {
      eyebrow: 'The Head Spa Experience',
      title: 'A Moment Just for You',
      body: [
        'At ORA, you will experience a thoughtfully designed head spa journey featuring deep scalp cleansing, botanical care, a soothing warm herbal head bath, gentle head and neck relaxation, and nourishing hair rituals.',
        'Surrounded by calming aromas, comforting warmth, and a peaceful atmosphere, every moment is designed to help you unwind, release everyday stress, and enjoy a deeply relaxing experience that nurtures both body and mind.',
      ],
    },
  ],
  closing: {
    eyebrow: 'ORA Toucheer',
    title: 'More Than Hair Care',
    body: 'A personalized journey of relaxation and well-being. Waltham, Massachusetts.',
    cta: 'Book your ritual',
    imageAlt: 'ORA herbal head spa atmosphere',
  },
}

const simplifiedChinese: AboutCopy = {
  hero: {
    eyebrow: 'ORA Toucheer · 马萨诸塞州沃尔瑟姆',
    title: '我们的故事',
    subtitle:
      '一段源自苗寨的草本养护传承，从贵州的群山一路来到 Waltham——也是 ORA 每一次头疗背后的由来。',
  },
  chapters: [
    {
      eyebrow: '品牌渊源',
      title: '植根于草本传统',
      body: [
        'ORA 的草本头皮与身体养护灵感，来自苗族世代相传的草本文化。',
        '数百年间，草本智慧深深融入苗家人的日常——从采摘山间草木，到世代相传的护发、养身与安心之法。这份绵延至今的传统，塑造了一种尊重自然、重视健康、美丽与身心安顿的生活方式。',
      ],
    },
    {
      eyebrow: '草本之道',
      title: '甄选 · 调配 · 熬制',
      body: [
        '我们相信，自然万物都带着独特的能量，与我们的身体和状态紧密相连。借由自然的馈赠，我们找回平衡、恢复元气，也养出更健康的生活方式。',
        '我们的草本理念，从甄选优质植材开始，遵循古法调配与熬制：以文火慢煨数十小时，让草本缓缓释放精华，最终熬成三款招牌草本原汤，把自然的智慧与生命力带入每一次头疗体验。',
      ],
    },
    {
      eyebrow: '品牌历程',
      title: '一份延续至今的传承',
      body: [
        'TOUCHEER 创立于 1998 年，数十年间稳步成长，在中国发展出超过 10,000 家门店，并将脚步延伸至新加坡、美国、加拿大、马来西亚等地。以植物养护的智慧，TOUCHEER 为世界各地的人们带来更放松、更平衡、更健康的生活方式。',
        '今天，我很荣幸把这份传承已久的草本养护传统带到马萨诸塞州 Waltham，并以 ORA 之名与你相遇。',
      ],
      stats: [
        { value: '1998', label: '品牌创立' },
        { value: '10,000+', label: '全球门店' },
        { value: '5+', label: '国家与地区' },
      ],
    },
    {
      eyebrow: '头疗体验',
      title: '只属于你的一段时间',
      body: [
        '在 ORA，你将体验一套精心设计的头疗流程：深层头皮清洁、草本养护、温热草本头浴、头部与颈肩的轻柔放松，以及滋养发丝的护理仪式。',
        '在安抚的香气、恰到好处的温度与安静的氛围中，让每一刻都帮助你卸下日常的紧绷与压力，享受一场身心都被照顾到的深度放松。',
      ],
    },
  ],
  closing: {
    eyebrow: 'ORA Toucheer',
    title: '不止于护发',
    body: '一段关于放松与身心养护的专属旅程。马萨诸塞州 Waltham。',
    cta: '预约体验',
    imageAlt: 'ORA 草本头疗空间',
  },
}

const traditionalChinese: AboutCopy = {
  hero: {
    eyebrow: 'ORA Toucheer · 麻薩諸塞州沃爾瑟姆',
    title: '我們的故事',
    subtitle:
      '一段源自苗寨的草本養護傳承，從貴州的群山一路來到 Waltham——也是 ORA 每一次頭療背後的由來。',
  },
  chapters: [
    {
      eyebrow: '品牌淵源',
      title: '植根於草本傳統',
      body: [
        'ORA 的草本頭皮與身體養護靈感，來自苗族世代相傳的草本文化。',
        '數百年間，草本智慧深深融入苗家人的日常——從採摘山間草木，到世代相傳的護髮、養身與安心之法。這份綿延至今的傳統，塑造了一種尊重自然、重視健康、美麗與身心安頓的生活方式。',
      ],
    },
    {
      eyebrow: '草本之道',
      title: '甄選 · 調配 · 熬製',
      body: [
        '我們相信，自然萬物都帶著獨特的能量，與我們的身體和狀態緊密相連。藉由自然的饋贈，我們找回平衡、恢復元氣，也養出更健康的生活方式。',
        '我們的草本理念，從甄選優質植材開始，遵循古法調配與熬製：以文火慢煨數十小時，讓草本緩緩釋放精華，最終熬成三款招牌草本原湯，把自然的智慧與生命力帶入每一次頭療體驗。',
      ],
    },
    {
      eyebrow: '品牌歷程',
      title: '一份延續至今的傳承',
      body: [
        'TOUCHEER 創立於 1998 年，數十年間穩步成長，在中國發展出超過 10,000 家門店，並將腳步延伸至新加坡、美國、加拿大、馬來西亞等地。以植物養護的智慧，TOUCHEER 為世界各地的人們帶來更放鬆、更平衡、更健康的生活方式。',
        '今天，我很榮幸把這份傳承已久的草本養護傳統帶到麻薩諸塞州 Waltham，並以 ORA 之名與你相遇。',
      ],
      stats: [
        { value: '1998', label: '品牌創立' },
        { value: '10,000+', label: '全球門店' },
        { value: '5+', label: '國家與地區' },
      ],
    },
    {
      eyebrow: '頭療體驗',
      title: '只屬於你的一段時間',
      body: [
        '在 ORA，你將體驗一套精心設計的頭療流程：深層頭皮清潔、草本養護、溫熱草本頭浴、頭部與頸肩的輕柔放鬆，以及滋養髮絲的護理儀式。',
        '在安撫的香氣、恰到好處的溫度與安靜的氛圍中，讓每一刻都幫助你卸下日常的緊繃與壓力，享受一場身心都被照顧到的深度放鬆。',
      ],
    },
  ],
  closing: {
    eyebrow: 'ORA Toucheer',
    title: '不止於護髮',
    body: '一段關於放鬆與身心養護的專屬旅程。麻薩諸塞州 Waltham。',
    cta: '預約體驗',
    imageAlt: 'ORA 草本頭療空間',
  },
}

const aboutCopy: Partial<Record<Locale, AboutCopy>> = {
  en: english,
  zh: simplifiedChinese,
  'zh-TW': traditionalChinese,
}

export default function AboutPage() {
  const locale = useSiteStore((state) => state.locale)
  const t = aboutCopy[locale] ?? english
  const bookHref = `${isComingSoon() ? '/preview' : '/'}?lang=${locale}#booking`

  useEffect(() => {
    window.scrollTo(0, 0)
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible')
        })
      },
      { threshold: 0.12 },
    )
    document
      .querySelectorAll('.observe-reveal')
      .forEach((element) => revealObserver.observe(element))
    return () => revealObserver.disconnect()
  }, [])

  return (
    <main className="about-page">
      <Header actionHref={bookHref} returnToHome showFullNavigation />

      <section className="about-page__hero">
        <img src="/images/about/story-hero.jpg" alt="" />
        <div className="about-page__hero-inner">
          <p className="eyebrow eyebrow--light">{t.hero.eyebrow}</p>
          <h1>{t.hero.title}</h1>
          <p className="about-page__lede">{t.hero.subtitle}</p>
        </div>
      </section>

      <div className="about-story section-shell">
        {t.chapters.map((chapter, index) => {
          const media = chapterMedia[index]
          const alt = media?.alt[locale as 'en' | 'zh' | 'zh-TW'] ?? media?.alt.en
          return (
            <article
              className={`about-chapter ${index % 2 === 1 ? 'is-reversed' : ''}`}
              key={chapter.title}
            >
              <figure className="about-chapter__media observe-reveal">
                <img src={media?.image} alt={alt ?? ''} loading="lazy" />
              </figure>
              <div className="about-chapter__body observe-reveal">
                <span className="about-chapter__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="eyebrow">{chapter.eyebrow}</p>
                <h2>{chapter.title}</h2>
                {chapter.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {chapter.stats && (
                  <div className="about-chapter__stats">
                    {chapter.stats.map((stat) => (
                      <div key={stat.label}>
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <section className="about-closing">
        <div className="about-closing__inner observe-reveal">
          <p className="eyebrow eyebrow--light">{t.closing.eyebrow}</p>
          <h2>{t.closing.title}</h2>
          <p>{t.closing.body}</p>
          <a className="about-closing__cta" href={bookHref}>
            {t.closing.cta}
            <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="about-closing__visual">
          <img
            src="/images/about/miao-portrait.jpg"
            alt={t.closing.imageAlt}
            loading="lazy"
          />
        </div>
      </section>

      <Footer />
    </main>
  )
}
