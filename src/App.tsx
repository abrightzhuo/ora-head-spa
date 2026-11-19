import { useEffect, useState } from 'react'
import { JsonLd } from './components/JsonLd'
import { MobileAppNav } from './components/MobileAppNav'
import { breadcrumbGraph } from './data/structuredData'
import AboutPage from './pages/About'
import Home from './pages/Home'
import Admin from './pages/Admin'
import CustomerAccount from './pages/CustomerAccount'
import Forum from './pages/Forum'
import GiftCards from './pages/GiftCards'
import Membership from './pages/Membership'
import ProviderProfile from './pages/ProviderProfile'
import {
  alternateLinks,
  isPublicRoute,
  localePath,
  stripLocale,
} from './lib/localeRouting'
import { useSiteStore, type Locale } from './store/useSiteStore'

const metadata: Record<
  Locale,
  {
    home: string
    about: string
    giftCards: string
      membership: string
    provider: string
    account: string
    description: string
  }
> = {
    zh: { home: 'ORA | 草本头皮与肌肤养护', about: 'ORA 品牌故事', giftCards: 'ORA 礼品卡', membership: 'ORA 年度会员', provider: 'ORA 专业头疗技师', account: '我的 ORA', description: 'ORA 以草本养护、专业手法和安静空间，为您带来专属的头皮与身心放松体验。' },
    'zh-TW': { home: 'ORA | 草本頭皮與肌膚養護', about: 'ORA 品牌故事', giftCards: 'ORA 禮品卡', membership: 'ORA 年度會員', provider: 'ORA 專業頭療技師', account: '我的 ORA', description: 'ORA 以草本養護、專業手法和安靜空間，為您帶來專屬的頭皮與身心放鬆體驗。' },
    en: { home: 'ORA Head Spa | Herbal Scalp & Skin Care in Waltham, MA', about: 'Our Story | ORA Head Spa, Waltham MA', giftCards: 'ORA Gift Cards', membership: 'ORA Annual Membership', provider: 'ORA Head Spa Provider', account: 'My ORA', description: 'ORA is a herbal head spa in Waltham, Massachusetts. Botanical scalp and skin rituals, one-to-one care and a quiet space — choose a 60–90 minute session and book online.' },
    es: { home: 'ORA | Bienestar herbal para cuero cabelludo y piel', about: 'Nuestra historia | ORA', giftCards: 'Tarjetas regalo ORA', membership: 'Membresía anual ORA', provider: 'Especialistas ORA en spa capilar', account: 'Mi ORA', description: 'ORA combina cuidado herbal, técnicas profesionales y un espacio tranquilo para el bienestar del cuero cabelludo.' },
    fr: { home: 'ORA | Bien-être végétal du cuir chevelu et de la peau', about: 'Notre histoire | ORA', giftCards: 'Cartes cadeaux ORA', membership: 'Adhésion annuelle ORA', provider: 'Spécialistes ORA du spa capillaire', account: 'Mon ORA', description: 'ORA associe soins végétaux, gestes professionnels et espace apaisant pour le bien-être du cuir chevelu.' },
    ja: { home: 'ORA | 植物の恵みによる頭皮と肌のウェルネス', about: 'ORAのものがたり', giftCards: 'ORA ギフトカード', membership: 'ORA 年間メンバーシップ', provider: 'ORA ヘッドスパ担当', account: 'My ORA', description: 'ORAは植物由来の頭皮ケア、専門的な手技、静かな空間で心身を整える時間をお届けします。' },
    ko: { home: 'ORA | 허브 두피와 피부 웰니스', about: 'ORA 브랜드 스토리', giftCards: 'ORA 기프트 카드', membership: 'ORA 연간 멤버십', provider: 'ORA 헤드 스파 테라피스트', account: 'My ORA', description: 'ORA는 허브 두피 케어, 전문적인 테크닉, 고요한 공간을 통해 편안한 웰니스 경험을 제공합니다.' },
    de: { home: 'ORA | Pflanzliche Kopfhaut- und Hautpflege', about: 'Unsere Geschichte | ORA', giftCards: 'ORA Geschenkkarten', membership: 'ORA Jahresmitgliedschaft', provider: 'ORA Kopfspa-Spezialistinnen', account: 'Mein ORA', description: 'ORA verbindet pflanzliche Kopfhautpflege, professionelle Techniken und einen ruhigen Raum für nachhaltiges Wohlbefinden.' },
    ru: { home: 'ORA | Растительный уход за кожей головы и лица', about: 'Наша история | ORA', giftCards: 'Подарочные карты ORA', membership: 'Годовое членство ORA', provider: 'Специалисты ORA по уходу за кожей головы', account: 'Мой ORA', description: 'ORA сочетает растительный уход, профессиональные техники и спокойное пространство для восстановления.' },
}

/** 论坛页标题：与问答页面文案保持同一语气 */
const forumTitle: Record<Locale, string> = {
  zh: '顾客问答 | ORA',
  'zh-TW': '顧客問答 | ORA',
  en: 'Ask ORA | Customer Q&A',
  es: 'Pregunta a ORA | Preguntas de la comunidad',
  fr: 'Demandez à ORA | Questions de la communauté',
  ja: 'ORA に質問する | お客様の質問',
  ko: 'ORA에게 묻기 | 고객 문의',
  de: 'Frag ORA | Fragen der Community',
  ru: 'Спросите ORA | Вопросы гостей',
}

const forumDescription: Record<Locale, string> = {
  zh: '查看顾客关于头皮护理、服务项目与到店体验的真实提问，以及 ORA 团队的亲自回复。登录后即可提问。',
  'zh-TW': '查看顧客關於頭皮護理、服務項目與到店體驗的真實提問，以及 ORA 團隊的親自回覆。登入後即可提問。',
  en: 'Real questions from guests about scalp care, treatments and visits to ORA Head Spa, answered personally by our team. Sign in to ask your own question.',
  es: 'Preguntas reales de clientes sobre el cuidado del cuero cabelludo, los tratamientos y las visitas, respondidas por el equipo de ORA. Inicia sesión para preguntar.',
  fr: 'De vraies questions de clients sur le soin du cuir chevelu, les soins et les visites, avec les réponses de l’équipe ORA. Connectez-vous pour poser la vôtre.',
  ja: '頭皮ケアやメニュー、ご来店についてのお客様の実際の質問と、ORA チームからの回答。ログインすると質問できます。',
  ko: '두피 케어와 시술, 방문에 대해 고객이 남긴 실제 질문과 ORA 팀의 답변을 확인하세요. 로그인 후 질문할 수 있습니다.',
  de: 'Echte Fragen von Gästen zu Kopfhautpflege, Behandlungen und Besuchen – persönlich beantwortet vom ORA-Team. Melden Sie sich an, um selbst zu fragen.',
  ru: 'Реальные вопросы гостей об уходе за кожей головы, процедурах и визитах, на которые отвечает команда ORA. Войдите, чтобы задать свой вопрос.',
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const locale = useSiteStore((state) => state.locale)

  // pushState 不会触发渲染：前进 / 后退后同步一次路径
  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // 去掉语言前缀后再做路由匹配：/es/about 与 /about 渲染同一个页面
  const path = stripLocale(pathname)
  const isHome = path === '/' || path === '/preview'
  // 首页的规范地址是 /preview（英文）或 /<slug>（其它语言）
  const publicRoute = isHome ? '/preview' : path
  const canonicalPath =
    isPublicRoute(publicRoute) && !(isHome && locale === 'en')
      ? localePath(locale, publicRoute)
      : pathname

  useEffect(() => {
    const current = metadata[locale]
    const isForum = path === '/forum'
    const title = isForum
      ? forumTitle[locale]
      : path === '/about'
        ? current.about
        : path === '/gift-cards'
          ? current.giftCards
          : path === '/membership'
            ? current.membership
            : path === '/account'
              ? current.account
              : path.startsWith('/providers/')
                ? current.provider
                : current.home
    const description = isForum ? forumDescription[locale] : current.description
    document.title = title

    const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
      let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attr, key)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', value)
    }

    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', `${window.location.origin}${canonicalPath}`)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = `${window.location.origin}${canonicalPath}`

    // 公开页：为 9 种语言各输出一条 hreflang，让搜索引擎知道各语言版本
    document
      .head
      .querySelectorAll('link[data-ora="alternate"]')
      .forEach((tag) => tag.remove())
    if (isPublicRoute(publicRoute)) {
      for (const { hreflang, href } of alternateLinks(
        publicRoute,
        window.location.origin,
      )) {
        const link = document.createElement('link')
        link.rel = 'alternate'
        link.hreflang = hreflang
        link.href = href
        link.dataset.ora = 'alternate'
        document.head.appendChild(link)
      }
    }
  }, [locale, path, publicRoute, canonicalPath])

  const page =
    path === '/admin' ? (
      <Admin />
    ) : path === '/about' ? (
      <AboutPage />
    ) : path === '/account' ? (
      <CustomerAccount />
    ) : path === '/gift-cards' ? (
      <GiftCards />
    ) : path === '/membership' ? (
      <Membership />
    ) : path === '/forum' ? (
      <Forum />
    ) : path.startsWith('/providers/') ? (
      <ProviderProfile providerId={path.split('/')[2] ?? ''} />
    ) : (
      <Home />
    )

  // 面包屑只给可被索引的公开子页，首页（/preview）本身不需要
  const breadcrumbs: { name: string; path: string }[] | null =
    path === '/about'
      ? [
          { name: 'ORA Head Spa', path: '/preview' },
          { name: 'Our Story', path: '/about' },
        ]
      : path === '/gift-cards'
        ? [
            { name: 'ORA Head Spa', path: '/preview' },
            { name: 'Gift Cards', path: '/gift-cards' },
          ]
        : path === '/membership'
          ? [
              { name: 'ORA Head Spa', path: '/preview' },
              { name: 'Annual Membership', path: '/membership' },
            ]
          : path === '/forum'
            ? [
                { name: 'ORA Head Spa', path: '/preview' },
                { name: 'Customer Q&A', path: '/forum' },
              ]
            : null

  return (
    <>
      {breadcrumbs && <JsonLd data={breadcrumbGraph(breadcrumbs)} id="breadcrumb" />}
      {page}
      {path !== '/admin' && <MobileAppNav />}
    </>
  )
}
