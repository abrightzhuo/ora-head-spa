import { ArrowLeft, Award, CalendarDays, Languages } from 'lucide-react'
import { BrandMark } from '../components/BrandMark'
import {
  providerTranslation,
  useBookingCatalog,
} from '../hooks/useBookingCatalog'
import { useMembershipPricing } from '../hooks/useMembershipPricing'
import { copy as siteCopy } from '../localizedContent'
import { useSiteStore, type Locale } from '../store/useSiteStore'

type Props = {
  providerId: string
}

const pageCopy: Record<
  Locale,
  {
    notFound: string
    back: string
    provider: string
    book: (name: string) => string
    specialties: string
    experience: string
    experienceYears: (years: number) => string
    team: string
    languages: string
    available: string
    treatments: string
    minute: string
    languageNames: Record<string, string>
  }
> = {
  zh: { notFound: '未找到该技师', back: '返回预约', provider: '专业头疗技师', book: (name) => `预约 ${name}`, specialties: '擅长技术', experience: '专业经验', experienceYears: (years) => `${years} 年专业经验`, team: 'ORA 专业服务团队', languages: '服务语言', available: '可预约项目', treatments: '熟悉的护理项目', minute: '分钟', languageNames: { English: '英语', Mandarin: '中文' } },
  'zh-TW': { notFound: '未找到該技師', back: '返回預約', provider: '專業頭療技師', book: (name) => `預約 ${name}`, specialties: '擅長技術', experience: '專業經驗', experienceYears: (years) => `${years} 年專業經驗`, team: 'ORA 專業服務團隊', languages: '服務語言', available: '可預約項目', treatments: '熟悉的護理項目', minute: '分鐘', languageNames: { English: '英語', Mandarin: '中文' } },
  en: { notFound: 'Provider not found', back: 'Back to booking', provider: 'Head Spa Provider', book: (name) => `Book with ${name}`, specialties: 'Specialties', experience: 'Experience', experienceYears: (years) => `${years} years of professional experience`, team: 'ORA professional care team', languages: 'Languages', available: 'Available services', treatments: 'Treatments & techniques', minute: 'min', languageNames: { English: 'English', Mandarin: 'Mandarin' } },
  es: { notFound: 'Especialista no encontrada', back: 'Volver a reservar', provider: 'Especialista en spa capilar', book: (name) => `Reservar con ${name}`, specialties: 'Especialidades', experience: 'Experiencia', experienceYears: (years) => `${years} años de experiencia profesional`, team: 'Equipo profesional de ORA', languages: 'Idiomas', available: 'Servicios disponibles', treatments: 'Tratamientos y técnicas', minute: 'min', languageNames: { English: 'Inglés', Mandarin: 'Mandarín' } },
  fr: { notFound: 'Spécialiste introuvable', back: 'Retour à la réservation', provider: 'Spécialiste du spa capillaire', book: (name) => `Réserver avec ${name}`, specialties: 'Spécialités', experience: 'Expérience', experienceYears: (years) => `${years} ans d’expérience professionnelle`, team: 'Équipe professionnelle ORA', languages: 'Langues', available: 'Services disponibles', treatments: 'Soins et techniques', minute: 'min', languageNames: { English: 'Anglais', Mandarin: 'Mandarin' } },
  ja: { notFound: '担当者が見つかりません', back: '予約に戻る', provider: 'ヘッドスパ担当', book: (name) => `${name} を予約`, specialties: '得意な技術', experience: '経験', experienceYears: (years) => `専門経験 ${years} 年`, team: 'ORA プロフェッショナルチーム', languages: '対応言語', available: '予約可能なメニュー', treatments: 'トリートメントと技術', minute: '分', languageNames: { English: '英語', Mandarin: '中国語' } },
  ko: { notFound: '테라피스트를 찾을 수 없습니다', back: '예약으로 돌아가기', provider: '헤드 스파 테라피스트', book: (name) => `${name} 예약`, specialties: '전문 기술', experience: '경력', experienceYears: (years) => `전문 경력 ${years}년`, team: 'ORA 전문 케어 팀', languages: '서비스 언어', available: '예약 가능한 서비스', treatments: '트리트먼트 및 테크닉', minute: '분', languageNames: { English: '영어', Mandarin: '중국어' } },
  de: { notFound: 'Spezialistin nicht gefunden', back: 'Zurück zur Buchung', provider: 'Kopfspa-Spezialistin', book: (name) => `Bei ${name} buchen`, specialties: 'Spezialgebiete', experience: 'Erfahrung', experienceYears: (years) => `${years} Jahre Berufserfahrung`, team: 'Professionelles ORA-Team', languages: 'Sprachen', available: 'Verfügbare Behandlungen', treatments: 'Behandlungen und Techniken', minute: 'Min.', languageNames: { English: 'Englisch', Mandarin: 'Mandarin' } },
  ru: { notFound: 'Специалист не найден', back: 'Вернуться к записи', provider: 'Специалист по уходу за кожей головы', book: (name) => `Записаться к ${name}`, specialties: 'Специализация', experience: 'Опыт', experienceYears: (years) => `${years} лет профессионального опыта`, team: 'Профессиональная команда ORA', languages: 'Языки', available: 'Доступные услуги', treatments: 'Процедуры и техники', minute: 'мин', languageNames: { English: 'Английский', Mandarin: 'Китайский' } },
}

export default function ProviderProfile({ providerId }: Props) {
  const locale = useSiteStore((state) => state.locale)
  const t = pageCopy[locale]
  const { catalog, loading, error } = useBookingCatalog()
  const { servicePrice } = useMembershipPricing()
  const provider = catalog?.providers.find((item) => item.id === providerId)
  const services = (catalog?.services ?? []).filter((service) =>
    provider?.service_ids.includes(service.id),
  )

  if (loading) {
    return <main className="provider-profile-state">...</main>
  }

  if (error || !provider) {
    return (
      <main className="provider-profile-state">
        <BrandMark />
        <h1>{t.notFound}</h1>
        <a href="/#booking">{t.back}</a>
      </main>
    )
  }
  const translated = providerTranslation(provider, locale)
  const requestedServiceId =
    new URLSearchParams(window.location.search).get('service') ?? ''
  const bookingParams = new URLSearchParams({
    lang: locale,
    provider: provider.id,
  })
  if (services.some((service) => service.id === requestedServiceId)) {
    bookingParams.set('service', requestedServiceId)
  }
  const bookingHref = `/?${bookingParams.toString()}#booking`

  return (
    <main className="provider-profile-page">
      <header>
        <BrandMark href={`/?lang=${locale}`} />
        <a href={bookingHref}>
          <ArrowLeft size={16} />
          {t.back}
        </a>
      </header>

      <section className="provider-profile-hero">
        <div className="provider-profile-photo">
          {provider.photo_url ? (
            <img src={provider.photo_url} alt={provider.display_name} />
          ) : (
            <span style={{ backgroundColor: provider.color }}>
              {provider.display_name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p>{siteCopy[locale].hero.eyebrow}</p>
          <h1>{provider.display_name}</h1>
          <h2>
            {translated.headline || t.provider}
          </h2>
          {translated.bio && (
            <p className="provider-profile-bio">
              {translated.bio}
            </p>
          )}
          <a
            className="provider-profile-book"
            href={bookingHref}
          >
            <CalendarDays size={17} />
            {t.book(provider.display_name)}
          </a>
        </div>
      </section>

      <section className="provider-profile-details">
        {translated.specialties.length > 0 && (
          <article>
            <Award size={20} />
            <h3>{t.specialties}</h3>
            <ul>
              {translated.specialties.map((specialty) => (
                <li key={specialty}>{specialty}</li>
              ))}
            </ul>
          </article>
        )}
        <article>
          <CalendarDays size={20} />
          <h3>{t.experience}</h3>
          <p>
            {provider.experience_years !== null
              ? t.experienceYears(provider.experience_years)
              : t.team}
          </p>
        </article>
        {provider.languages.length > 0 && (
          <article>
            <Languages size={20} />
            <h3>{t.languages}</h3>
            <p>
              {provider.languages
                .map((language) => t.languageNames[language] ?? language)
                .join(' · ')}
            </p>
          </article>
        )}
      </section>

      {services.length > 0 && (
        <section className="provider-profile-services">
          <p>{t.available}</p>
          <h2>{t.treatments}</h2>
          <div>
            {services.map((service) => (
              <article key={service.id}>
                <h3>
                  {siteCopy[locale].services.items[
                    ['pure-reset', 'vital-glow', 'deep-stillness'].indexOf(
                      service.code,
                    )
                  ]?.title ??
                    (locale.startsWith('zh')
                      ? service.name_zh || service.name
                      : service.name)}
                </h3>
                <p>
                  {siteCopy[locale].services.items[
                    ['pure-reset', 'vital-glow', 'deep-stillness'].indexOf(
                      service.code,
                    )
                  ]?.description ??
                    (locale.startsWith('zh')
                      ? service.description_zh || service.description
                      : service.description)}
                </p>
                <span>
                  ${(servicePrice(service) / 100).toFixed(2)} ·{' '}
                  {service.duration_minutes} {t.minute}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
