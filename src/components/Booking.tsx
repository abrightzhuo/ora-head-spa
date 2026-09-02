import { useEffect, useState, type FormEvent } from 'react'
import { ArrowUpRight, CalendarDays, Check, CheckCircle2, Clock3, MapPin, Phone, Sparkles } from 'lucide-react'
import { copy } from '../localizedContent'
import { easternDateKey, formatDateKey } from '../lib/dateTime'
import { supabase } from '../lib/supabase'
import { useSiteStore, type Locale } from '../store/useSiteStore'

type FormState = {
  name: string
  phone: string
  service: string
  date: string
  message: string
}

const emptyForm: FormState = { name: '', phone: '', service: '', date: '', message: '' }

type ConfirmationCopy = {
  title: string
  welcome: (name: string) => string
  note: string
  details: string
  none: string
  again: string
}

const confirmationCopy: Record<Locale, ConfirmationCopy> = {
  zh: { title: '预约成功', welcome: (name) => `${name}，欢迎来到 ORA`, note: '我们已为您记录本次预约，专属顾问将尽快与您确认具体时间。期待在 ORA 与您相见。', details: '预约信息', none: '未填写', again: '重新预约' },
  'zh-TW': { title: '預約成功', welcome: (name) => `${name}，歡迎來到 ORA`, note: '我們已為您記錄本次預約，專屬顧問將儘快與您確認具體時間。期待在 ORA 與您相見。', details: '預約資訊', none: '未填寫', again: '重新預約' },
  en: { title: 'Reservation received', welcome: (name) => `Welcome to ORA, ${name}`, note: 'Your reservation details are saved. Our concierge will contact you shortly to confirm the time. We look forward to welcoming you.', details: 'Reservation details', none: 'Not provided', again: 'Make another reservation' },
  es: { title: 'Reserva recibida', welcome: (name) => `Bienvenido a ORA, ${name}`, note: 'Hemos guardado tu reserva. Nuestro asesor te contactará pronto para confirmar la hora. Esperamos darte la bienvenida.', details: 'Datos de la reserva', none: 'No indicado', again: 'Hacer otra reserva' },
  fr: { title: 'Réservation reçue', welcome: (name) => `Bienvenue chez ORA, ${name}`, note: 'Votre réservation est enregistrée. Notre conseiller vous contactera bientôt pour confirmer l’horaire. Au plaisir de vous accueillir.', details: 'Détails de la réservation', none: 'Non renseigné', again: 'Faire une autre réservation' },
  ja: { title: 'ご予約を承りました', welcome: (name) => `${name}様、ORAへようこそ`, note: 'ご予約内容を承りました。担当者より日時確認のご連絡を差し上げます。ご来店を心よりお待ちしております。', details: 'ご予約内容', none: '未入力', again: '別の予約をする' },
  ko: { title: '예약이 접수되었습니다', welcome: (name) => `${name}님, ORA에 오신 것을 환영합니다`, note: '예약 내용을 저장했습니다. 전담 담당자가 곧 연락드려 시간을 확인해 드립니다. ORA에서 뵙기를 기대합니다.', details: '예약 정보', none: '입력하지 않음', again: '다시 예약하기' },
  de: { title: 'Reservierung erhalten', welcome: (name) => `Willkommen bei ORA, ${name}`, note: 'Ihre Reservierung wurde gespeichert. Unsere persönliche Beratung meldet sich in Kürze zur Terminbestätigung. Wir freuen uns auf Sie.', details: 'Reservierungsdetails', none: 'Nicht angegeben', again: 'Weitere Reservierung' },
  ru: { title: 'Заявка принята', welcome: (name) => `Добро пожаловать в ORA, ${name}`, note: 'Мы сохранили данные Вашей записи. Консультант скоро свяжется с Вами для подтверждения времени. Будем рады встрече.', details: 'Данные записи', none: 'Не указано', again: 'Записаться ещё раз' },
}

const datePlaceholder: Record<Locale, string> = {
  zh: '年/月/日',
  'zh-TW': '年/月/日',
  en: 'MM/DD/YYYY',
  es: 'DD/MM/AAAA',
  fr: 'JJ/MM/AAAA',
  ja: '年/月/日',
  ko: '연/월/일',
  de: 'TT.MM.JJJJ',
  ru: 'ДД.ММ.ГГГГ',
}

const submitCopy: Record<Locale, { saving: string; saveError: string }> = {
  zh: { saving: '正在提交...', saveError: '预约暂时无法提交，请稍后重试。' },
  'zh-TW': { saving: '正在提交...', saveError: '預約暫時無法提交，請稍後重試。' },
  en: { saving: 'Submitting...', saveError: 'We could not submit your reservation. Please try again.' },
  es: { saving: 'Enviando...', saveError: 'No pudimos enviar tu reserva. Inténtalo de nuevo.' },
  fr: { saving: 'Envoi...', saveError: 'Votre réservation n’a pas pu être envoyée. Veuillez réessayer.' },
  ja: { saving: '送信中...', saveError: 'ご予約を送信できませんでした。もう一度お試しください。' },
  ko: { saving: '제출 중...', saveError: '예약을 제출하지 못했습니다. 다시 시도해 주세요.' },
  de: { saving: 'Wird gesendet...', saveError: 'Ihre Reservierung konnte nicht gesendet werden. Bitte versuchen Sie es erneut.' },
  ru: { saving: 'Отправка...', saveError: 'Не удалось отправить заявку. Пожалуйста, попробуйте ещё раз.' },
}

export function Booking() {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale]
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submittedForm, setSubmittedForm] = useState<(FormState & { serviceIndex: number }) | null>(null)
  const [status, setStatus] = useState<'idle' | 'error' | 'phone-error' | 'submitting' | 'save-error' | 'success'>('idle')

  useEffect(() => {
    const onSelectService = (event: Event) => {
      const selected = (event as CustomEvent<string>).detail
      setSubmittedForm(null)
      setStatus('idle')
      setForm((current) => ({ ...current, service: selected }))
    }
    const onBookingLinkClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      if (!target?.closest('a[href="#booking"]')) return
      resetBooking()
    }
    const resetBooking = () => {
      setSubmittedForm(null)
      setStatus('idle')
      setForm(emptyForm)
    }
    window.addEventListener('ora:select-service', onSelectService)
    window.addEventListener('ora:open-booking', resetBooking)
    document.addEventListener('click', onBookingLinkClick)
    return () => {
      window.removeEventListener('ora:select-service', onSelectService)
      window.removeEventListener('ora:open-booking', resetBooking)
      document.removeEventListener('click', onBookingLinkClick)
    }
  }, [])

  useEffect(() => {
    if (!form.service) return
    const allServices = Object.values(copy).flatMap((localeCopy) => localeCopy.services.items)
    const currentIndex = allServices.findIndex((item) => item.title === form.service)
    if (currentIndex < 0) return
    const normalizedIndex = currentIndex % t.services.items.length
    setForm((current) => ({ ...current, service: t.services.items[normalizedIndex].title }))
  }, [locale, t.services.items, form.service])

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setStatus('idle')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.service || !form.date) {
      setStatus('error')
      return
    }
    if (!/^[+\d][\d\s()-]{6,}$/.test(form.phone.trim())) {
      setStatus('phone-error')
      return
    }

    setStatus('submitting')

    if (!supabase) {
      setStatus('save-error')
      return
    }

    try {
      const { error } = await supabase.from('appointments').insert({
        customer_name: form.name.trim(),
        phone: form.phone.trim(),
        service: form.service,
        preferred_date: form.date,
        message: form.message.trim() || null,
        locale,
      })

      if (error) {
        setStatus('save-error')
        return
      }
    } catch {
      setStatus('save-error')
      return
    }

    const serviceIndex = t.services.items.findIndex((item) => item.title === form.service)
    setSubmittedForm({ ...form, serviceIndex })
    setStatus('success')
    setForm(emptyForm)
  }

  const feedback =
    status === 'phone-error'
        ? t.booking.phoneError
        : status === 'error'
          ? t.booking.required
          : status === 'save-error'
            ? submitCopy[locale].saveError
          : ''
  const confirmation = confirmationCopy[locale]
  const formattedDate = submittedForm
    ? formatDateKey(submittedForm.date, locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''
  const submittedService = submittedForm
    ? t.services.items[submittedForm.serviceIndex]?.title ?? submittedForm.service
    : ''

  return (
    <section className="booking" id="booking">
      <div className="booking__glow" aria-hidden="true" />
      <div className="section-shell booking__inner">
        <div className="booking__content observe-reveal">
          <p className="eyebrow eyebrow--light">{t.booking.eyebrow}</p>
          <h2>{t.booking.title}</h2>
          <p className="booking__intro">{t.booking.body}</p>
          <div className="booking__details">
            <div>
              <Phone />
              <p>
                <span>{t.booking.contact}</span>
                <strong>{t.booking.contactValue}</strong>
              </p>
            </div>
            <div>
              <Clock3 />
              <p>
                <span>{t.booking.hours}</span>
                <strong>{t.booking.hoursValue}</strong>
              </p>
            </div>
            <div>
              <MapPin />
              <p>
                <span>{t.booking.address}</span>
                <strong>{t.booking.addressValue}</strong>
              </p>
            </div>
          </div>
        </div>
        {submittedForm && status === 'success' ? (
          <div className="booking-confirmation" role="status" aria-live="polite">
            <div className="booking-confirmation__icon"><CheckCircle2 /></div>
            <p className="booking-confirmation__eyebrow"><Sparkles size={13} /> {confirmation.title}</p>
            <h3>{confirmation.welcome(submittedForm.name)}</h3>
            <p className="booking-confirmation__note">{confirmation.note}</p>
            <div className="booking-confirmation__details">
              <p>{confirmation.details}</p>
              <dl>
                <div><dt><Check size={14} /> {t.booking.name}</dt><dd>{submittedForm.name}</dd></div>
                <div><dt><Phone size={14} /> {t.booking.phone}</dt><dd>{submittedForm.phone}</dd></div>
                <div><dt><Sparkles size={14} /> {t.booking.service}</dt><dd>{submittedService}</dd></div>
                <div><dt><CalendarDays size={14} /> {t.booking.date}</dt><dd>{formattedDate}</dd></div>
                <div className="booking-confirmation__message"><dt>{t.booking.message}</dt><dd>{submittedForm.message || confirmation.none}</dd></div>
              </dl>
            </div>
            <button
              className="booking-confirmation__again"
              type="button"
              onClick={() => {
                setSubmittedForm(null)
                setStatus('idle')
              }}
            >
              {confirmation.again}
              <ArrowUpRight size={16} />
            </button>
          </div>
        ) : (
        <form className="booking-form" onSubmit={submit} noValidate>
          <div className="form-row">
            <label>
              <span>{t.booking.name} *</span>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} autoComplete="name" />
            </label>
            <label>
              <span>{t.booking.phone} *</span>
              <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} inputMode="tel" autoComplete="tel" />
            </label>
          </div>
          <div className="form-row">
            <label>
              <span>{t.booking.service} *</span>
              <select value={form.service} onChange={(event) => updateField('service', event.target.value)}>
                <option value="">—</option>
                {t.services.items.map((service) => <option key={service.number} value={service.title}>{service.title}</option>)}
              </select>
            </label>
            <label>
              <span>{t.booking.date} *</span>
              <div className={`date-input ${form.date ? 'has-value' : ''}`}>
                <input
                  className="date-input__control"
                  type="date"
                  lang={locale}
                  value={form.date}
                  min={easternDateKey()}
                  onChange={(event) => updateField('date', event.target.value)}
                />
                {!form.date && (
                  <span className="date-input__placeholder" aria-hidden="true">
                    {datePlaceholder[locale]}
                  </span>
                )}
              </div>
            </label>
          </div>
          <label>
            <span>{t.booking.message} <small>{t.booking.optional}</small></span>
            <textarea value={form.message} onChange={(event) => updateField('message', event.target.value)} rows={3} />
          </label>
          <div className="booking-form__footer">
            <p className={`form-feedback form-feedback--${status}`} role="status">{feedback}</p>
            <button className="button button--gold" type="submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? submitCopy[locale].saving : t.booking.submit}
              <ArrowUpRight size={17} />
            </button>
          </div>
        </form>
        )}
      </div>
    </section>
  )
}
