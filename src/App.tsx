import { useEffect } from 'react'
import { MobileAppNav } from './components/MobileAppNav'
import Home from './pages/Home'
import Admin from './pages/Admin'
import CustomerAccount from './pages/CustomerAccount'
import GiftCards from './pages/GiftCards'
import Membership from './pages/Membership'
import ProviderProfile from './pages/ProviderProfile'
import { useSiteStore, type Locale } from './store/useSiteStore'

const metadata: Record<
  Locale,
  {
    home: string
    giftCards: string
      membership: string
    provider: string
    account: string
    description: string
  }
> = {
    zh: { home: 'ORA | 草本头皮与肌肤养护', giftCards: 'ORA 礼品卡', membership: 'ORA 年度会员', provider: 'ORA 专业头疗技师', account: '我的 ORA', description: 'ORA 以草本养护、专业手法和安静空间，为您带来专属的头皮与身心放松体验。' },
    'zh-TW': { home: 'ORA | 草本頭皮與肌膚養護', giftCards: 'ORA 禮品卡', membership: 'ORA 年度會員', provider: 'ORA 專業頭療技師', account: '我的 ORA', description: 'ORA 以草本養護、專業手法和安靜空間，為您帶來專屬的頭皮與身心放鬆體驗。' },
    en: { home: 'ORA | Herbal Scalp & Skin Wellness', giftCards: 'ORA Gift Cards', membership: 'ORA Annual Membership', provider: 'ORA Head Spa Provider', account: 'My ORA', description: 'ORA combines botanical scalp care, considered touch and a quiet space for restorative wellbeing.' },
    es: { home: 'ORA | Bienestar herbal para cuero cabelludo y piel', giftCards: 'Tarjetas regalo ORA', membership: 'Membresía anual ORA', provider: 'Especialistas ORA en spa capilar', account: 'Mi ORA', description: 'ORA combina cuidado herbal, técnicas profesionales y un espacio tranquilo para el bienestar del cuero cabelludo.' },
    fr: { home: 'ORA | Bien-être végétal du cuir chevelu et de la peau', giftCards: 'Cartes cadeaux ORA', membership: 'Adhésion annuelle ORA', provider: 'Spécialistes ORA du spa capillaire', account: 'Mon ORA', description: 'ORA associe soins végétaux, gestes professionnels et espace apaisant pour le bien-être du cuir chevelu.' },
    ja: { home: 'ORA | 植物の恵みによる頭皮と肌のウェルネス', giftCards: 'ORA ギフトカード', membership: 'ORA 年間メンバーシップ', provider: 'ORA ヘッドスパ担当', account: 'My ORA', description: 'ORAは植物由来の頭皮ケア、専門的な手技、静かな空間で心身を整える時間をお届けします。' },
    ko: { home: 'ORA | 허브 두피와 피부 웰니스', giftCards: 'ORA 기프트 카드', membership: 'ORA 연간 멤버십', provider: 'ORA 헤드 스파 테라피스트', account: 'My ORA', description: 'ORA는 허브 두피 케어, 전문적인 테크닉, 고요한 공간을 통해 편안한 웰니스 경험을 제공합니다.' },
    de: { home: 'ORA | Pflanzliche Kopfhaut- und Hautpflege', giftCards: 'ORA Geschenkkarten', membership: 'ORA Jahresmitgliedschaft', provider: 'ORA Kopfspa-Spezialistinnen', account: 'Mein ORA', description: 'ORA verbindet pflanzliche Kopfhautpflege, professionelle Techniken und einen ruhigen Raum für nachhaltiges Wohlbefinden.' },
    ru: { home: 'ORA | Растительный уход за кожей головы и лица', giftCards: 'Подарочные карты ORA', membership: 'Годовое членство ORA', provider: 'Специалисты ORA по уходу за кожей головы', account: 'Мой ORA', description: 'ORA сочетает растительный уход, профессиональные техники и спокойное пространство для восстановления.' },
}

export default function App() {
  const path = window.location.pathname
  const locale = useSiteStore((state) => state.locale)

  useEffect(() => {
    const current = metadata[locale]
    document.title =
      path === '/gift-cards'
        ? current.giftCards
          : path === '/membership'
            ? current.membership
        : path === '/account'
          ? current.account
          : path.startsWith('/providers/')
            ? current.provider
            : current.home
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', current.description)
  }, [locale, path])

  const page =
    path === '/admin' ? (
      <Admin />
    ) : path === '/account' ? (
      <CustomerAccount />
    ) : path === '/gift-cards' ? (
      <GiftCards />
    ) : path === '/membership' ? (
      <Membership />
    ) : path.startsWith('/providers/') ? (
      <ProviderProfile providerId={path.split('/')[2] ?? ''} />
    ) : (
      <Home />
    )

  return (
    <>
      {page}
      {path !== '/admin' && <MobileAppNav />}
    </>
  )
}
