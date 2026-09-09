import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/customerAuth'
import { customerCopy } from '../customerCopy'
import { copy } from '../localizedContent'
import {
  useBookingCatalog,
  type BookingProvider,
  type BookingService,
  providerTranslation,
} from '../hooks/useBookingCatalog'
import { useMembershipPricing } from '../hooks/useMembershipPricing'
import {
  easternDateKey,
  formatEasternDateTime,
  shiftDateKey,
} from '../lib/dateTime'
import { supabase } from '../lib/supabase'
import { useSiteStore, type Locale } from '../store/useSiteStore'

type Slot = {
  starts_at: string
  ends_at: string
  providers: { id: string; name: string }[]
}

type FormState = {
  serviceId: string
  providerId: string
  date: string
  startsAt: string
  name: string
  phone: string
  email: string
  notes: string
}

type BookingResult = {
  id: string
  customer_name: string
  service: string
  provider_name: string
  starts_at: string
  ends_at: string
  price_cents: number
  location: string
  card_on_file?: {
    card_brand: string | null
    card_last_four: string | null
  }
}

type SquareConfig = {
  enabled: boolean
  applicationId: string | null
  locationId: string | null
  environment: 'sandbox' | 'production'
}

type SquareCard = {
  attach: (selector: string) => Promise<void>
  tokenize: (verificationDetails?: Record<string, unknown>) => Promise<{
    status: string
    token?: string
    errors?: { message: string }[]
  }>
  destroy: () => Promise<void>
}

const emptyForm: FormState = {
  serviceId: '',
  providerId: '',
  date: '',
  startsAt: '',
  name: '',
  phone: '',
  email: '',
  notes: '',
}

const providerActionCopy: Record<
  Locale,
  { view: string; select: string; selected: string; fallback: string }
> = {
  zh: { view: '查看介绍', select: '选择', selected: '已选择', fallback: 'ORA 专业头疗技师' },
  'zh-TW': { view: '查看介紹', select: '選擇', selected: '已選擇', fallback: 'ORA 專業頭療技師' },
  en: { view: 'View profile', select: 'Select', selected: 'Selected', fallback: 'ORA Head Spa Provider' },
  es: { view: 'Ver perfil', select: 'Elegir', selected: 'Elegida', fallback: 'Especialista ORA en spa capilar' },
  fr: { view: 'Voir le profil', select: 'Choisir', selected: 'Sélectionnée', fallback: 'Spécialiste ORA du spa capillaire' },
  ja: { view: 'プロフィール', select: '選択', selected: '選択済み', fallback: 'ORA ヘッドスパ担当' },
  ko: { view: '프로필 보기', select: '선택', selected: '선택됨', fallback: 'ORA 헤드 스파 테라피스트' },
  de: { view: 'Profil ansehen', select: 'Auswählen', selected: 'Ausgewählt', fallback: 'ORA Head-Spa-Spezialistin' },
  ru: { view: 'О специалисте', select: 'Выбрать', selected: 'Выбрано', fallback: 'Специалист ORA по уходу за кожей головы' },
}

const paymentCopy: Record<
  Locale,
  {
    title: string
    body: string
    unavailable: string
    failed: string
    button: string
    processing: string
    saved: string
    consent: string
  }
> = {
  zh: { title: 'Square 安全存卡', body: '预约时不会扣款。付款方式由 Square 安全保存，仅在符合下方取消政策并经门店确认后收取相应费用。', unavailable: '在线信用卡验证暂不可用。', failed: '信用卡验证失败，请检查信息后重试。', button: '保存付款方式并确认预约', processing: '正在安全验证付款方式...', saved: '付款方式已由 Square 安全保存', consent: '我授权 ORA 通过 Square 安全保存此付款方式，并同意在预约开始前 24 小时内取消或更改时收取预约金额的 15%，在未到店且未提前联系时收取预约金额的 50%。' },
  'zh-TW': { title: 'Square 安全存卡', body: '預約時不會扣款。付款方式由 Square 安全保存，僅在符合下方取消政策並經門店確認後收取相應費用。', unavailable: '線上信用卡驗證暫不可用。', failed: '信用卡驗證失敗，請檢查資料後重試。', button: '儲存付款方式並確認預約', processing: '正在安全驗證付款方式...', saved: '付款方式已由 Square 安全儲存', consent: '我授權 ORA 透過 Square 安全儲存此付款方式，並同意在預約開始前 24 小時內取消或更改時收取預約金額的 15%，未到店且未提前聯絡時收取預約金額的 50%。' },
  en: { title: 'Secure card on file', body: 'No charge is made when booking. Square securely stores this payment method and ORA may charge only the applicable fee after staff review.', unavailable: 'Online card verification is currently unavailable.', failed: 'Card verification failed. Check your details and try again.', button: 'Save card & confirm booking', processing: 'Securely verifying your card...', saved: 'Payment method securely stored by Square', consent: 'I authorize ORA to securely store this payment method with Square and charge 15% of the booked service price for cancellations or changes within 24 hours, or 50% for a no-show.' },
  es: { title: 'Tarjeta guardada de forma segura', body: 'No se realiza ningún cargo al reservar. Square guarda el método de pago y ORA solo podrá cobrar la tarifa aplicable tras revisarla.', unavailable: 'La verificación de tarjeta no está disponible.', failed: 'No se pudo verificar la tarjeta.', button: 'Guardar tarjeta y confirmar', processing: 'Verificando la tarjeta...', saved: 'Método de pago guardado de forma segura por Square', consent: 'Autorizo a ORA a guardar este método de pago con Square y cobrar el 15% por cancelaciones o cambios dentro de 24 horas, o el 50% por no presentarse.' },
  fr: { title: 'Carte enregistrée en toute sécurité', body: 'Aucun débit lors de la réservation. Square conserve le moyen de paiement et ORA ne prélève les frais applicables qu’après vérification.', unavailable: 'La vérification de carte est indisponible.', failed: 'Échec de la vérification de la carte.', button: 'Enregistrer et confirmer', processing: 'Vérification sécurisée...', saved: 'Moyen de paiement enregistré par Square', consent: 'J’autorise ORA à enregistrer ce moyen de paiement avec Square et à prélever 15 % pour une annulation ou modification dans les 24 heures, ou 50 % en cas de non-présentation.' },
  ja: { title: 'Squareによるカードの安全な保存', body: '予約時に請求は発生しません。Squareが支払い方法を安全に保存し、規定に該当する場合のみ店舗確認後に料金を請求します。', unavailable: 'カード認証は現在利用できません。', failed: 'カード認証に失敗しました。', button: 'カードを保存して予約確定', processing: 'カードを安全に認証中...', saved: '支払い方法はSquareに安全に保存されました', consent: 'Squareで支払い方法を安全に保存し、24時間以内のキャンセルまたは変更には予約料金の15%、無断キャンセルには50%を請求することをORAに許可します。' },
  ko: { title: 'Square 안전 카드 저장', body: '예약 시 결제되지 않습니다. Square가 결제 수단을 안전하게 저장하며 정책 적용 시 직원 확인 후 수수료가 청구됩니다.', unavailable: '카드 인증을 사용할 수 없습니다.', failed: '카드 인증에 실패했습니다.', button: '카드 저장 및 예약 확정', processing: '카드를 안전하게 인증 중...', saved: '결제 수단이 Square에 안전하게 저장되었습니다', consent: 'Square에 결제 수단을 안전하게 저장하고 24시간 이내 취소 또는 변경 시 예약 금액의 15%, 노쇼 시 50%를 ORA가 청구하는 데 동의합니다.' },
  de: { title: 'Sicher hinterlegte Karte', body: 'Bei der Buchung erfolgt keine Belastung. Square speichert die Zahlungsart sicher; ORA berechnet Gebühren erst nach Prüfung.', unavailable: 'Kartenprüfung ist derzeit nicht verfügbar.', failed: 'Kartenprüfung fehlgeschlagen.', button: 'Karte speichern und bestätigen', processing: 'Karte wird sicher geprüft...', saved: 'Zahlungsart sicher bei Square gespeichert', consent: 'Ich ermächtige ORA, diese Zahlungsart bei Square zu speichern und bei Stornierung oder Änderung innerhalb von 24 Stunden 15 % bzw. bei Nichterscheinen 50 % zu berechnen.' },
  ru: { title: 'Безопасное сохранение карты', body: 'При бронировании списания нет. Square безопасно хранит способ оплаты; ORA взимает применимый сбор только после проверки.', unavailable: 'Проверка карты сейчас недоступна.', failed: 'Не удалось проверить карту.', button: 'Сохранить карту и подтвердить', processing: 'Безопасная проверка карты...', saved: 'Способ оплаты безопасно сохранён в Square', consent: 'Я разрешаю ORA сохранить этот способ оплаты в Square и списать 15% при отмене или изменении менее чем за 24 часа либо 50% при неявке.' },
}

const extraCopy: Record<
  Locale,
  {
    provider: string
    noPreference: string
    time: string
    email: string
    price: string
    duration: string
    expect: string
    selectService: string
    selectDate: string
    noSlots: string
    loading: string
    unavailable: string
    special: string
    specialHint: string
    confirmation: string
    queued: string
    slotTaken: string
    invalid: string
    retry: string
    cancellation: string
    again: string
  }
> = {
  zh: {
    provider: '选择技师',
    noPreference: '不指定 / 最早可用',
    time: '可预约时间',
    email: '电子邮箱',
    price: '价格',
    duration: '时长',
    expect: '服务流程',
    selectService: '请先选择项目',
    selectDate: '请选择日期查看可预约时间',
    noSlots: '当天暂无可预约时间',
    loading: '正在读取可预约时间...',
    unavailable: '在线预约尚未开放，请稍后再试。',
    special: '到店前需要告知我们的情况',
    specialHint: '例如头皮敏感、伤口、孕期、过敏、行动不便或其他特殊情况',
    confirmation: '预约已确认',
    queued: '确认邮件将自动发送；短信在门店启用短信服务后同步发送。',
    slotTaken: '该时间刚刚已被预约，请重新选择。',
    invalid: '请完整填写必填信息。',
    retry: '预约提交失败，请重试。',
    cancellation: '取消政策',
    again: '再次预约',
  },
  'zh-TW': {
    provider: '選擇技師',
    noPreference: '不指定 / 最早可用',
    time: '可預約時間',
    email: '電子郵箱',
    price: '價格',
    duration: '時長',
    expect: '服務流程',
    selectService: '請先選擇項目',
    selectDate: '請選擇日期查看可預約時間',
    noSlots: '當天暫無可預約時間',
    loading: '正在讀取可預約時間...',
    unavailable: '線上預約尚未開放，請稍後再試。',
    special: '到店前需要告知我們的情況',
    specialHint: '例如頭皮敏感、傷口、孕期、過敏、行動不便或其他特殊情況',
    confirmation: '預約已確認',
    queued: '確認郵件將自動發送；簡訊在門店啟用服務後同步發送。',
    slotTaken: '該時間剛剛已被預約，請重新選擇。',
    invalid: '請完整填寫必填資訊。',
    retry: '預約提交失敗，請重試。',
    cancellation: '取消政策',
    again: '再次預約',
  },
  en: {
    provider: 'Provider',
    noPreference: 'No Preference / First Available',
    time: 'Available time',
    email: 'Электронная почта',
    price: 'Price',
    duration: 'Duration',
    expect: 'What to Expect',
    selectService: 'Select a service first',
    selectDate: 'Choose a date to see available times',
    noSlots: 'No appointments are available on this date',
    loading: 'Loading available times...',
    unavailable: 'Online booking is not open yet. Please check back shortly.',
    special: 'Anything we should know before your visit?',
    specialHint: 'Scalp sensitivity, wounds, pregnancy, allergies, mobility limitations or other needs',
    confirmation: 'Booking Confirmed',
    queued: 'Your email confirmation is sent automatically. SMS is also sent when text messaging is enabled.',
    slotTaken: 'That time was just booked. Please choose another time.',
    invalid: 'Complete all required fields.',
    retry: 'We could not complete your booking. Please try again.',
    cancellation: 'Cancellation Policy',
    again: 'Book another visit',
  },
  es: {
    provider: 'Especialista',
    noPreference: 'Sin preferencia / Primero disponible',
    time: 'Hora disponible',
    email: 'Email',
    price: 'Precio',
    duration: 'Duración',
    expect: 'Qué esperar',
    selectService: 'Selecciona un servicio',
    selectDate: 'Elige una fecha para ver horarios',
    noSlots: 'No hay horarios disponibles este día',
    loading: 'Cargando horarios...',
    unavailable: 'La reserva online aún no está disponible.',
    special: '¿Hay algo que debamos saber?',
    specialHint: 'Sensibilidad, heridas, embarazo, alergias o movilidad',
    confirmation: 'Reserva confirmada',
    queued: 'La confirmación se enviará por email y SMS.',
    slotTaken: 'Ese horario acaba de reservarse. Elige otro.',
    invalid: 'Completa todos los campos obligatorios.',
    retry: 'No pudimos completar la reserva.',
    cancellation: 'Política de cancelación',
    again: 'Reservar de nuevo',
  },
  fr: {
    provider: 'Praticien',
    noPreference: 'Sans préférence / Premier disponible',
    time: 'Horaire disponible',
    email: 'E-mail',
    price: 'Prix',
    duration: 'Durée',
    expect: 'Déroulement',
    selectService: 'Choisissez un service',
    selectDate: 'Choisissez une date pour voir les horaires',
    noSlots: 'Aucun créneau disponible ce jour',
    loading: 'Chargement des horaires...',
    unavailable: 'La réservation en ligne sera bientôt disponible.',
    special: 'Une information à nous communiquer ?',
    specialHint: 'Sensibilité, plaies, grossesse, allergies ou mobilité',
    confirmation: 'Réservation confirmée',
    queued: 'La confirmation sera envoyée par e-mail et SMS.',
    slotTaken: 'Ce créneau vient d’être réservé. Choisissez-en un autre.',
    invalid: 'Complétez tous les champs obligatoires.',
    retry: 'Impossible de finaliser la réservation.',
    cancellation: 'Politique d’annulation',
    again: 'Réserver à nouveau',
  },
  ja: {
    provider: '担当者',
    noPreference: '指名なし / 最短で予約可能',
    time: '予約可能時間',
    email: 'メール',
    price: '料金',
    duration: '所要時間',
    expect: '施術の流れ',
    selectService: 'メニューを選択してください',
    selectDate: '日付を選択してください',
    noSlots: 'この日は空きがありません',
    loading: '空き時間を確認中...',
    unavailable: 'オンライン予約は準備中です。',
    special: '事前にお知らせいただきたいこと',
    specialHint: '頭皮の敏感、傷、妊娠、アレルギー、移動の制限など',
    confirmation: '予約が確定しました',
    queued: '確認メールとSMSが自動送信されます。',
    slotTaken: 'この時間は予約済みです。別の時間をお選びください。',
    invalid: '必須項目を入力してください。',
    retry: '予約を完了できませんでした。',
    cancellation: 'キャンセルポリシー',
    again: '別の予約をする',
  },
  ko: {
    provider: '담당자',
    noPreference: '지정 없음 / 가장 빠른 시간',
    time: '예약 가능 시간',
    email: '이메일',
    price: '가격',
    duration: '소요 시간',
    expect: '서비스 과정',
    selectService: '서비스를 선택해 주세요',
    selectDate: '날짜를 선택해 주세요',
    noSlots: '이 날짜에는 예약 가능한 시간이 없습니다',
    loading: '예약 가능 시간을 확인 중...',
    unavailable: '온라인 예약을 준비 중입니다.',
    special: '방문 전 알려주실 사항',
    specialHint: '두피 민감성, 상처, 임신, 알레르기, 이동 제한 등',
    confirmation: '예약이 확정되었습니다',
    queued: '확인 이메일과 SMS가 자동 발송됩니다.',
    slotTaken: '방금 예약된 시간입니다. 다른 시간을 선택해 주세요.',
    invalid: '필수 항목을 모두 입력해 주세요.',
    retry: '예약을 완료하지 못했습니다.',
    cancellation: '취소 정책',
    again: '다시 예약하기',
  },
  de: {
    provider: 'Behandler',
    noPreference: 'Keine Präferenz / Erster verfügbar',
    time: 'Verfügbare Zeit',
    email: 'E-Mail',
    price: 'Preis',
    duration: 'Dauer',
    expect: 'Ablauf',
    selectService: 'Bitte Behandlung wählen',
    selectDate: 'Datum wählen, um Zeiten zu sehen',
    noSlots: 'An diesem Tag sind keine Termine frei',
    loading: 'Verfügbare Zeiten werden geladen...',
    unavailable: 'Die Online-Buchung ist noch nicht geöffnet.',
    special: 'Was sollten wir vor Ihrem Besuch wissen?',
    specialHint: 'Empfindlichkeit, Wunden, Schwangerschaft, Allergien oder Mobilität',
    confirmation: 'Termin bestätigt',
    queued: 'Bestätigung wird per E-Mail und SMS gesendet.',
    slotTaken: 'Dieser Termin wurde gerade gebucht. Bitte neu wählen.',
    invalid: 'Bitte alle Pflichtfelder ausfüllen.',
    retry: 'Die Buchung konnte nicht abgeschlossen werden.',
    cancellation: 'Stornierungsbedingungen',
    again: 'Weiteren Termin buchen',
  },
  ru: {
    provider: 'Специалист',
    noPreference: 'Без предпочтений / Первый доступный',
    time: 'Доступное время',
    email: 'Email',
    price: 'Цена',
    duration: 'Длительность',
    expect: 'Что вас ждёт',
    selectService: 'Выберите услугу',
    selectDate: 'Выберите дату, чтобы увидеть время',
    noSlots: 'На эту дату свободного времени нет',
    loading: 'Загрузка свободного времени...',
    unavailable: 'Онлайн-запись пока не открыта.',
    special: 'Что нам важно знать до визита?',
    specialHint: 'Чувствительность, раны, беременность, аллергии или ограничения подвижности',
    confirmation: 'Запись подтверждена',
    queued: 'Подтверждение будет отправлено по электронной почте и SMS.',
    slotTaken: 'Это время только что заняли. Выберите другое.',
    invalid: 'Заполните обязательные поля.',
    retry: 'Не удалось завершить запись.',
    cancellation: 'Правила отмены',
    again: 'Записаться снова',
  },
}

const welcomeCopy: Record<Locale, string> = {
  zh: '期待在 ORA TOUCHEER 欢迎您的到来。',
  'zh-TW': '期待在 ORA TOUCHEER 歡迎您的到來。',
  en: 'We look forward to welcoming you to ORA TOUCHEER.',
  es: 'Esperamos darle la bienvenida en ORA TOUCHEER.',
  fr: 'Nous avons hâte de vous accueillir chez ORA TOUCHEER.',
  ja: 'ORA TOUCHEERでお迎えできることを楽しみにしております。',
  ko: 'ORA TOUCHEER에서 만나 뵙기를 기대합니다.',
  de: 'Wir freuen uns darauf, Sie bei ORA TOUCHEER willkommen zu heißen.',
  ru: 'Будем рады приветствовать Вас в ORA TOUCHEER.',
}

const minuteCopy: Record<Locale, string> = {
  zh: '分钟',
  'zh-TW': '分鐘',
  en: 'min',
  es: 'min',
  fr: 'min',
  ja: '分',
  ko: '분',
  de: 'Min.',
  ru: 'мин',
}

const locationCopy: Record<Locale, string> = {
  zh: 'ORA TOUCHEER 头疗与健康中心',
  'zh-TW': 'ORA TOUCHEER 頭療與健康中心',
  en: 'ORA Head Spa & Wellness',
  es: 'ORA Bienestar del cuero cabelludo',
  fr: 'ORA Bien-être du cuir chevelu',
  ja: 'ORA ヘッドスパ＆ウェルネス',
  ko: 'ORA 헤드 스파 & 웰니스',
  de: 'ORA Kopfhautpflege und Wohlbefinden',
  ru: 'ORA СПА-уход за кожей головы и оздоровление',
}

const cancellationPolicyCopy: Record<
  Locale,
  { notice: string; rules: string[] }
> = {
  zh: {
    notice: '为保障每位顾客的预约时间及技师安排，取消或更改预约适用以下政策：',
    rules: [
      '在预约时间 24 小时以前取消或更改，不收取任何费用，已付金额将全额退还。',
      '在预约时间前 24 小时以内取消或更改，将收取预约项目金额 15% 的临时取消费，其余已付金额予以退还。',
      '如顾客未到店且未提前取消或联系门店，将收取预约项目金额 50% 的未到店费用，其余已付金额予以退还。',
    ],
  },
  'zh-TW': {
    notice: '為保障每位顧客的預約時間及技師安排，取消或更改預約適用以下政策：',
    rules: [
      '於預約時間 24 小時以前取消或更改，不收取任何費用，已付金額將全額退還。',
      '於預約時間前 24 小時以內取消或更改，將收取預約項目金額 15% 的臨時取消費，其餘已付金額予以退還。',
      '如顧客未到店且未提前取消或聯絡門店，將收取預約項目金額 50% 的未到店費用，其餘已付金額予以退還。',
    ],
  },
  en: {
    notice: 'To protect each guest’s reserved time and our providers’ schedules, the following policy applies to cancellations and changes:',
    rules: [
      'Cancellations or changes made more than 24 hours before the appointment incur no fee, and any amount paid will be refunded in full.',
      'Cancellations or changes made within 24 hours of the appointment are subject to a Late Cancellation Fee equal to 15% of the scheduled service price. Any remaining prepaid amount will be refunded.',
      'If a guest does not arrive and has not cancelled or contacted us in advance, a No-show Fee equal to 50% of the scheduled service price applies. Any remaining prepaid amount will be refunded.',
    ],
  },
  es: {
    notice: 'Para proteger el tiempo reservado de cada cliente y la agenda de nuestros especialistas, se aplica la siguiente política:',
    rules: [
      'Las cancelaciones o cambios realizados con más de 24 horas de antelación no tienen cargo y se reembolsa íntegramente cualquier importe pagado.',
      'Las cancelaciones o cambios dentro de las 24 horas anteriores están sujetos a un cargo por cancelación tardía del 15% del precio del servicio. Se reembolsa el resto del prepago.',
      'Si el cliente no se presenta y no cancela ni contacta con antelación, se aplica un cargo por ausencia del 50% del precio del servicio. Se reembolsa el resto del prepago.',
    ],
  },
  fr: {
    notice: 'Afin de préserver le créneau de chaque client et l’organisation de nos praticiens, la politique suivante s’applique :',
    rules: [
      'Toute annulation ou modification effectuée plus de 24 heures avant le rendez-vous est sans frais et tout montant payé est intégralement remboursé.',
      'Toute annulation ou modification effectuée dans les 24 heures précédant le rendez-vous entraîne des frais d’annulation tardive de 15 % du prix du soin. Le solde prépayé est remboursé.',
      'En cas d’absence sans annulation ni contact préalable, des frais de non-présentation de 50 % du prix du soin s’appliquent. Le solde prépayé est remboursé.',
    ],
  },
  ja: {
    notice: 'お客様の予約枠と担当者のスケジュールを確保するため、キャンセルおよび変更には以下の規定が適用されます。',
    rules: [
      '予約時刻の24時間より前のキャンセルまたは変更には料金はかからず、お支払い済み金額は全額返金します。',
      '予約時刻まで24時間以内のキャンセルまたは変更には、施術料金の15%を直前キャンセル料として申し受け、残額を返金します。',
      '事前のキャンセルや連絡なく来店されなかった場合、施術料金の50%を無断キャンセル料として申し受け、残額を返金します。',
    ],
  },
  ko: {
    notice: '고객님의 예약 시간과 담당자의 일정을 보호하기 위해 취소 및 변경 시 다음 정책이 적용됩니다.',
    rules: [
      '예약 시간 24시간 이전에 취소 또는 변경하면 수수료가 없으며 결제 금액 전액을 환불합니다.',
      '예약 시간 24시간 이내에 취소 또는 변경하면 서비스 금액의 15%가 당일 취소 수수료로 부과되며 나머지 선결제 금액은 환불됩니다.',
      '사전 취소나 연락 없이 방문하지 않으면 서비스 금액의 50%가 노쇼 수수료로 부과되며 나머지 선결제 금액은 환불됩니다.',
    ],
  },
  de: {
    notice: 'Zum Schutz der reservierten Zeit und der Einsatzplanung unserer Behandler gelten folgende Bedingungen:',
    rules: [
      'Stornierungen oder Änderungen mehr als 24 Stunden vor dem Termin sind kostenfrei; bereits gezahlte Beträge werden vollständig erstattet.',
      'Bei Stornierungen oder Änderungen innerhalb von 24 Stunden vor dem Termin fällt eine kurzfristige Stornogebühr von 15 % des Behandlungspreises an. Der verbleibende vorausbezahlte Betrag wird erstattet.',
      'Bei Nichterscheinen ohne vorherige Absage oder Kontaktaufnahme fällt eine No-show-Gebühr von 50 % des Behandlungspreises an. Der verbleibende vorausbezahlte Betrag wird erstattet.',
    ],
  },
  ru: {
    notice: 'Чтобы сохранить зарезервированное время клиента и график специалиста, действуют следующие правила:',
    rules: [
      'При отмене или переносе более чем за 24 часа плата не взимается, а внесённая сумма возвращается полностью.',
      'При отмене или переносе менее чем за 24 часа удерживается сбор за позднюю отмену в размере 15% стоимости услуги. Остаток предоплаты возвращается.',
      'При неявке без предварительной отмены или связи с салоном удерживается сбор в размере 50% стоимости услуги. Остаток предоплаты возвращается.',
    ],
  },
}

const serviceCodes = ['pure-reset', 'vital-glow', 'deep-stillness']

function localizedService(service: BookingService, locale: Locale) {
  const localized =
    copy[locale].services.items[serviceCodes.indexOf(service.code)]

  return {
    name:
      localized?.title ??
      (locale.startsWith('zh')
        ? service.name_zh || service.name
        : service.name),
    description:
      localized?.description ??
      (locale.startsWith('zh')
        ? service.description_zh || service.description
        : service.description),
    expectations: localized?.highlights ?? service.what_to_expect,
  }
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function providerSupports(
  provider: BookingProvider,
  serviceId: string,
) {
  return provider.service_ids.includes(serviceId)
}

export function BookingV2() {
  const locale = useSiteStore((state) => state.locale)
  const t = copy[locale]
  const labels = extraCopy[locale]
  const providerLabels = providerActionCopy[locale]
  const paymentLabels = paymentCopy[locale]
  const customerLabels = customerCopy[locale]
  const { session, openAuth } = useCustomerAuth()
  const registeredName =
    typeof session?.user.user_metadata?.full_name === 'string'
      ? session.user.user_metadata.full_name.trim()
      : typeof session?.user.user_metadata?.name === 'string'
        ? session.user.user_metadata.name.trim()
        : ''
  const registeredPhone =
    typeof session?.user.user_metadata?.phone === 'string'
      ? session.user.user_metadata.phone.trim()
      : ''
  const registeredEmail =
    typeof session?.user.user_metadata?.contact_email === 'string'
      ? session.user.user_metadata.contact_email.trim()
      : session?.user.email?.trim() ?? ''
  const { catalog, loading: catalogLoading, error: catalogError } =
    useBookingCatalog()
  const { servicePrice } = useMembershipPricing()
  const requestedBooking = new URLSearchParams(window.location.search)
  const requestedProviderId = requestedBooking.get('provider') ?? ''
  const requestedServiceId = requestedBooking.get('service') ?? ''
  const [form, setForm] = useState<FormState>(emptyForm)
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
    const [currentTime, setCurrentTime] = useState(Date.now)
  const [status, setStatus] = useState<
    | 'idle'
    | 'submitting'
    | 'error'
    | 'slot-taken'
    | 'payment-failed'
    | 'auth-required'
    | 'auth-ready'
    | 'failed'
    | 'success'
  >('idle')
  const [booking, setBooking] = useState<BookingResult | null>(null)
  const [squareConfig, setSquareConfig] = useState<SquareConfig | null>(null)
  const squareCardRef = useRef<SquareCard | null>(null)
  const [paymentReady, setPaymentReady] = useState(false)
  const [paymentLoadFailed, setPaymentLoadFailed] = useState(false)
  const [paymentPolicyAccepted, setPaymentPolicyAccepted] = useState(false)
  const idempotencyKeyRef = useRef<string | null>(null)

  const service = catalog?.services.find(
    (item) => item.id === form.serviceId,
  )
  const serviceText = service ? localizedService(service, locale) : null
  const displayedServicePrice = service
    ? servicePrice(service, form.startsAt || form.date)
    : null
  const providers = useMemo(
    () =>
      (catalog?.providers ?? []).filter((provider) =>
        providerSupports(provider, form.serviceId),
      ),
    [catalog?.providers, form.serviceId],
  )
  const selectedProvider = providers.find(
    (provider) => provider.id === form.providerId,
  )
    const visibleSlots = useMemo(
      () =>
        slots.filter(
          (slot) => new Date(slot.starts_at).getTime() > currentTime,
        ),
      [currentTime, slots],
    )
  const paymentFormVisible = Boolean(catalog && !booking)

  const minDate = catalog ? easternDateKey() : ''
  const maxDate = catalog
    ? shiftDateKey(minDate, catalog.settings.booking_window_days)
    : ''
  const dateOptions = useMemo(() => {
    if (!minDate || !maxDate) return []

    const formatter = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
    const current = new Date(`${minDate}T12:00:00Z`)
    const end = new Date(`${maxDate}T12:00:00Z`)
    const options: { value: string; label: string }[] = []

    while (current <= end) {
      options.push({
        value: current.toISOString().slice(0, 10),
        label: formatter.format(current),
      })
      current.setUTCDate(current.getUTCDate() + 1)
    }

    return options
  }, [locale, maxDate, minDate])
  const configuredLocation = catalog?.settings.location
  const displayLocation =
    configuredLocation &&
    !/head spa|wellness/i.test(configuredLocation)
      ? configuredLocation
      : locationCopy[locale]

  useEffect(() => {
    fetch('/api/square-config')
      .then((response) => response.json())
      .then((config: SquareConfig) => setSquareConfig(config))
      .catch(() => setSquareConfig(null))
  }, [])

    useEffect(() => {
      const timer = window.setInterval(() => setCurrentTime(Date.now()), 60000)
      return () => window.clearInterval(timer)
    }, [])

    useEffect(() => {
      if (
        form.startsAt &&
        !visibleSlots.some((slot) => slot.starts_at === form.startsAt)
      ) {
        setForm((current) => ({ ...current, startsAt: '' }))
      }
    }, [form.startsAt, visibleSlots])

  useEffect(() => {
    if (!session) {
      setForm((current) => ({
        ...current,
        name: '',
        phone: '',
        email: '',
      }))
      return
    }

    setForm((current) => ({
      ...current,
      name: registeredName || current.name,
      phone: registeredPhone || current.phone,
      email: registeredEmail || current.email,
    }))
    setStatus((current) =>
      current === 'auth-required' ? 'auth-ready' : current,
    )
  }, [registeredEmail, registeredName, registeredPhone, session])

  useEffect(() => {
    if (
      !squareConfig?.enabled ||
      !squareConfig.applicationId ||
      !squareConfig.locationId ||
      !paymentFormVisible
    ) {
      return
    }

    let cancelled = false
    let card: SquareCard | null = null
    const scriptUrl =
      squareConfig.environment === 'production'
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js'

    const initialize = async () => {
      setPaymentLoadFailed(false)
      if (!window.Square) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector<HTMLScriptElement>(
            `script[src="${scriptUrl}"]`,
          )
          if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true })
            existing.addEventListener(
              'error',
              () => reject(new Error('square_load_failed')),
              { once: true },
            )
            return
          }

          const script = document.createElement('script')
          script.src = scriptUrl
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('square_load_failed'))
          document.head.appendChild(script)
        })
      }
      if (!window.Square || cancelled) return

      const payments = await window.Square.payments(
        squareConfig.applicationId,
        squareConfig.locationId,
      )
      card = await payments.card()
      if (cancelled) {
        await card.destroy()
        return
      }
      await card.attach('#booking-square-card')
      squareCardRef.current = card
      setPaymentReady(true)
    }

    void initialize().catch(() => {
      if (!cancelled) {
        setPaymentReady(false)
        setPaymentLoadFailed(true)
      }
    })

    return () => {
      cancelled = true
      setPaymentReady(false)
      if (squareCardRef.current === card) squareCardRef.current = null
      if (card) void card.destroy()
    }
  }, [
    paymentFormVisible,
    squareConfig?.applicationId,
    squareConfig?.enabled,
    squareConfig?.environment,
    squareConfig?.locationId,
  ])

  useEffect(() => {
    if (!requestedServiceId) return

    const selected = catalog?.services.find(
      (item) => item.id === requestedServiceId,
    )
    if (!selected) return

    setForm((current) => {
      if (current.serviceId) return current

      return {
        ...current,
        serviceId: selected.id,
        providerId:
          catalog?.providers.some(
            (provider) =>
              provider.id === requestedProviderId &&
              providerSupports(provider, selected.id),
          )
            ? requestedProviderId
            : '',
      }
    })

    window.requestAnimationFrame(() => {
      document.getElementById('booking')?.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      })
    })
  }, [
    catalog?.providers,
    catalog?.services,
    requestedProviderId,
    requestedServiceId,
  ])

  useEffect(() => {
    const selectService = (event: Event) => {
      const code = (event as CustomEvent<string>).detail
      const selected = catalog?.services.find((item) => item.code === code)
      if (!selected) return
      setForm((current) => ({
        ...current,
        serviceId: selected.id,
        providerId:
          catalog?.providers.some(
            (provider) =>
              provider.id === requestedProviderId &&
              providerSupports(provider, selected.id),
          )
            ? requestedProviderId
            : '',
        startsAt: '',
      }))
      setBooking(null)
      setStatus('idle')
    }
    window.addEventListener('ora:select-service', selectService)
    return () =>
      window.removeEventListener('ora:select-service', selectService)
  }, [catalog?.providers, catalog?.services, requestedProviderId])

  useEffect(() => {
    if (!form.serviceId || !form.date) {
      setSlots([])
      return
    }

    const controller = new AbortController()
    const loadSlots = async () => {
      setSlotsLoading(true)
      setForm((current) => ({ ...current, startsAt: '' }))
      const query = new URLSearchParams({
        serviceId: form.serviceId,
        date: form.date,
      })
      if (form.providerId) query.set('providerId', form.providerId)

      try {
        const response = await fetch(`/api/availability?${query}`, {
          signal: controller.signal,
        })
        const result = (await response.json()) as { slots?: Slot[] }
        if (!response.ok) throw new Error('availability_unavailable')
        setSlots(result.slots ?? [])
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setSlots([])
      } finally {
        setSlotsLoading(false)
      }
    }
    void loadSlots()
    return () => controller.abort()
  }, [form.date, form.providerId, form.serviceId])

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setStatus('idle')
  }

  const tokenizePayment = async () => {
    if (!squareCardRef.current || !paymentReady || !service) {
      throw new Error('square_not_ready')
    }

    const result = await squareCardRef.current.tokenize({
      billingContact: {
        givenName: form.name,
        email: form.email,
        phone: form.phone,
        countryCode: 'US',
      },
      intent: 'STORE',
      customerInitiated: true,
      sellerKeyedIn: false,
    })

    if (result.status !== 'OK' || !result.token) {
      throw new Error(
        result.errors?.map((error) => error.message).join('; ') ||
          'card_token_failed',
      )
    }
    return result.token
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
      if (!session) {
        setStatus('auth-required')
        openAuth('sign-in', {
          email: form.email,
          name: form.name,
          phone: form.phone,
        })
        return
      }

    if (
      !form.serviceId ||
      !form.date ||
      !form.startsAt ||
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !service ||
      !paymentReady ||
      !paymentPolicyAccepted
    ) {
      setStatus('error')
      return
    }

    setStatus('submitting')
    try {
        const profileUpdate = await supabase?.auth.updateUser({
          data: {
            ...session.user.user_metadata,
            full_name: form.name.trim(),
            phone: form.phone.trim(),
            contact_email: form.email.trim().toLowerCase(),
          },
        })
        if (!profileUpdate || profileUpdate.error) {
          setStatus('failed')
          return
        }

      const sourceId = await tokenizePayment()
      const idempotencyKey =
        idempotencyKeyRef.current ?? crypto.randomUUID()
      idempotencyKeyRef.current = idempotencyKey
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          serviceId: form.serviceId,
          providerId: form.providerId || null,
          startsAt: form.startsAt,
          notes: form.notes,
          locale,
          sourceId,
          idempotencyKey,
          paymentPolicyAccepted,
        }),
      })
      const result = (await response.json()) as {
        appointment?: BookingResult
        error?: string
      }
      if (response.status === 409) {
          idempotencyKeyRef.current = null
        setStatus('slot-taken')
        setForm((current) => ({ ...current, startsAt: '' }))
        return
      }
        if (response.status === 401 || response.status === 403) {
          idempotencyKeyRef.current = null
          setStatus('auth-required')
          openAuth('sign-in', { email: form.email })
          return
        }
        if (response.status === 402) {
          idempotencyKeyRef.current = null
          setStatus('payment-failed')
          return
        }
      if (!response.ok || !result.appointment) {
        setStatus('failed')
        return
      }
        idempotencyKeyRef.current = null
      setBooking(result.appointment)
      setStatus('success')
        setForm({
          ...emptyForm,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
        })
      setPaymentPolicyAccepted(false)
      } catch {
        idempotencyKeyRef.current = null
        setStatus('payment-failed')
    }
  }

  const feedback =
    status === 'error'
      ? labels.invalid
      : status === 'slot-taken'
        ? labels.slotTaken
        : status === 'auth-required'
          ? customerLabels.loginToPay
          : status === 'auth-ready'
            ? customerLabels.continuePayment
          : status === 'payment-failed'
            ? paymentLabels.failed
        : status === 'failed'
          ? labels.retry
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
                <strong>
                  {displayLocation}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {booking && status === 'success' ? (
          <div className="booking-confirmation" role="status">
            <div className="booking-confirmation__icon">
              <CheckCircle2 />
            </div>
            <p className="booking-confirmation__eyebrow">
              <Sparkles size={13} /> {labels.confirmation}
            </p>
            <h3>{welcomeCopy[locale]}</h3>
              {booking.card_on_file && (
                <p className="booking-confirmation__payment">
                  <CheckCircle2 size={16} />
                  {paymentLabels.saved}
                  {booking.card_on_file.card_last_four
                    ? ` · •••• ${booking.card_on_file.card_last_four}`
                    : ''}
                </p>
              )}
            <div className="booking-confirmation__details">
              <dl>
                <div>
                  <dt>{t.booking.name}</dt>
                  <dd>{booking.customer_name}</dd>
                </div>
                <div>
                  <dt>{t.booking.service}</dt>
                  <dd>{serviceText?.name ?? booking.service}</dd>
                </div>
                <div>
                  <dt>{labels.provider}</dt>
                  <dd>{booking.provider_name}</dd>
                </div>
                <div>
                  <dt>{labels.time}</dt>
                  <dd>
                      {formatEasternDateTime(booking.starts_at, locale, {
                      dateStyle: 'long',
                      timeStyle: 'short',
                      })}
                  </dd>
                </div>
                <div>
                  <dt>{labels.price}</dt>
                  <dd>${(booking.price_cents / 100).toFixed(2)}</dd>
                </div>
              </dl>
            </div>
            <p className="booking-confirmation__note">{labels.queued}</p>
            <button
              className="booking-confirmation__again"
              type="button"
              onClick={() => {
                setBooking(null)
                setStatus('idle')
              }}
            >
              {labels.again}
              <ArrowUpRight size={16} />
            </button>
          </div>
        ) : (
          <form className="booking-form booking-form--v2" onSubmit={submit}>
            {catalogLoading ? (
              <p>{labels.loading}</p>
            ) : catalogError || !catalog || catalog.services.length === 0 ? (
              <p className="form-feedback form-feedback--error">
                {labels.unavailable}
              </p>
            ) : (
              <>
                <label>
                  <span>{t.booking.service} *</span>
                  <select
                    value={form.serviceId}
                    onChange={(event) => {
                      const serviceId = event.target.value
                      update('serviceId', serviceId)
                      update(
                        'providerId',
                        catalog.providers.some(
                          (provider) =>
                            provider.id === requestedProviderId &&
                            providerSupports(provider, serviceId),
                        )
                          ? requestedProviderId
                          : '',
                      )
                      update('startsAt', '')
                    }}
                  >
                    <option value="">{labels.selectService}</option>
                    {catalog.services.map((item) => {
                      const localized = localizedService(item, locale)
                      return (
                        <option key={item.id} value={item.id}>
                          {localized.name} ·{' '}
                          {money(
                            servicePrice(item, form.startsAt || form.date),
                          )}{' '}
                          ·{' '}
                          {item.duration_minutes} {minuteCopy[locale]}
                        </option>
                      )
                    })}
                  </select>
                </label>

                {service && (
                  <div className="booking-service-preview">
                    <div>
                      <strong>
                        {serviceText?.name}
                      </strong>
                      <span>
                        {labels.price}: {money(displayedServicePrice ?? 0)}
                        {' · '}
                        {labels.duration}: {service.duration_minutes}{' '}
                        {minuteCopy[locale]}
                      </span>
                    </div>
                    <p>
                      {serviceText?.description}
                    </p>
                    <div>
                      <span>{labels.expect}</span>
                      <ul>
                        {serviceText?.expectations.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <label>
                    <span>{labels.provider} *</span>
                    <select
                      value={form.providerId}
                      disabled={!form.serviceId}
                      onChange={(event) =>
                        update('providerId', event.target.value)
                      }
                    >
                      <option value="">{labels.noPreference}</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.display_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>{t.booking.date} *</span>
                    <select
                      value={form.date}
                      disabled={!form.serviceId}
                      onChange={(event) => {
                        update('date', event.target.value)
                        update('startsAt', '')
                      }}
                    >
                      <option value="">{labels.selectDate}</option>
                      {dateOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {form.serviceId && providers.length > 0 && (
                  <div className="booking-provider-list">
                    {providers.map((provider) => (
                      <article
                        key={provider.id}
                        className={
                          form.providerId === provider.id ? 'is-selected' : ''
                        }
                      >
                        <a
                          href={`/providers/${provider.id}?lang=${locale}&service=${form.serviceId}`}
                          aria-label={`${provider.display_name} profile`}
                        >
                          {provider.photo_url ? (
                            <img
                              className="booking-provider-avatar"
                              src={provider.photo_url}
                              alt=""
                            />
                          ) : (
                            <span
                              className="booking-provider-avatar"
                              style={{ backgroundColor: provider.color }}
                            >
                              {provider.display_name.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <strong>{provider.display_name}</strong>
                        </a>
                        <small>
                          {providerTranslation(provider, locale).headline ||
                            providerTranslation(provider, locale).bio ||
                            providerLabels.fallback}
                        </small>
                        <div>
                          <a
                            href={`/providers/${provider.id}?lang=${locale}&service=${form.serviceId}`}
                          >
                            {providerLabels.view}
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              update('providerId', provider.id)
                              update('startsAt', '')
                            }}
                          >
                            {form.providerId === provider.id
                              ? providerLabels.selected
                              : providerLabels.select}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {selectedProvider?.bio && (
                  <p className="booking-provider-selected">
                    <strong>{selectedProvider.display_name}</strong>
                    {selectedProvider.bio}
                  </p>
                )}

                <label>
                  <span>{labels.time} *</span>
                  <select
                    value={form.startsAt}
                    disabled={!form.date || slotsLoading}
                    onChange={(event) =>
                      update('startsAt', event.target.value)
                    }
                  >
                    <option value="">
                      {slotsLoading
                        ? labels.loading
                        : !form.date
                          ? labels.selectDate
                          : visibleSlots.length === 0
                            ? labels.noSlots
                            : '—'}
                    </option>
                      {visibleSlots.map((slot) => (
                      <option key={slot.starts_at} value={slot.starts_at}>
                        {formatEasternDateTime(slot.starts_at, locale, {
                          hour: 'numeric',
                          minute: '2-digit',
                          timeZoneName: 'short',
                        })}
                      </option>
                    ))}
                  </select>
                </label>

                  <div className="form-row">
                    <label>
                      <span>{t.booking.name} *</span>
                      <div className="booking-input-icon">
                        <UserRound size={15} />
                        <input
                          value={form.name}
                          autoComplete="name"
                          onChange={(event) => update('name', event.target.value)}
                        />
                      </div>
                    </label>
                    <label>
                      <span>{t.booking.phone} *</span>
                      <div className="booking-input-icon">
                        <Phone size={15} />
                        <input
                          value={form.phone}
                          autoComplete="tel"
                          inputMode="tel"
                          onChange={(event) => update('phone', event.target.value)}
                        />
                      </div>
                    </label>
                  </div>

                  <label>
                    <span>{labels.email} *</span>
                    <div className="booking-input-icon">
                      <Mail size={15} />
                      <input
                        type="email"
                        value={form.email}
                        autoComplete="email"
                        onChange={(event) => update('email', event.target.value)}
                      />
                    </div>
                  </label>

                <label>
                  <span>{labels.special}</span>
                  <textarea
                    rows={3}
                    value={form.notes}
                    placeholder={labels.specialHint}
                    onChange={(event) => update('notes', event.target.value)}
                  />
                </label>

                  <div className="booking-policy">
                    <strong>{labels.cancellation}</strong>
                    <p>{cancellationPolicyCopy[locale].notice}</p>
                    <ol>
                      {cancellationPolicyCopy[locale].rules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="booking-payment">
                    <div className="booking-payment__heading">
                      <span>
                        <LockKeyhole size={16} />
                        {paymentLabels.title}
                      </span>
                      <strong>
                        {displayedServicePrice !== null
                          ? money(displayedServicePrice)
                          : '—'}
                      </strong>
                    </div>
                    <p>{paymentLabels.body}</p>
                    {squareConfig?.enabled ? (
                      <div id="booking-square-card" />
                    ) : (
                      <p className="booking-payment__error">
                        {paymentLabels.unavailable}
                      </p>
                    )}
                    {paymentLoadFailed && (
                      <p className="booking-payment__error">
                        {paymentLabels.unavailable}
                      </p>
                    )}
                    <label className="booking-payment__consent">
                      <input
                        type="checkbox"
                        checked={paymentPolicyAccepted}
                        onChange={(event) => {
                          setPaymentPolicyAccepted(event.target.checked)
                          setStatus('idle')
                        }}
                      />
                      <span>{paymentLabels.consent}</span>
                    </label>
                  </div>

                <div className="booking-form__footer">
                  <p
                    className={`form-feedback form-feedback--${status}`}
                    role="status"
                  >
                    {feedback}
                  </p>
                  <button
                    className={`button button--gold${
                        paymentPolicyAccepted ? '' : ' is-policy-pending'
                    }`}
                    type="submit"
                      disabled={
                        status === 'submitting' ||
                        !paymentReady ||
                        !paymentPolicyAccepted
                      }
                  >
                    {status === 'submitting'
                        ? paymentLabels.processing
                        : paymentLabels.button}
                      {status === 'submitting' ? (
                        <CreditCard size={17} />
                      ) : (
                        <ArrowUpRight size={17} />
                      )}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
