import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Check,
  Copy,
  CreditCard,
  Gift,
  Share2,
} from 'lucide-react'
import { Header } from '../components/Header'
import { useCustomerAuth } from '../contexts/customerAuth'
import { images } from '../content'
import { customerCopy } from '../customerCopy'
import { copy as siteCopy } from '../localizedContent'
import { useSiteStore, type Locale } from '../store/useSiteStore'

type SquareConfig = {
  enabled: boolean
  applicationId: string | null
  locationId: string | null
  environment: 'sandbox' | 'production'
}

type PurchaseResult = {
  code: string
  amountCents: number
  currency: string
  recipientName: string
  recipientEmail: string
  personalMessage: string | null
  receiptUrl: string | null
  emailDelivery?: {
    recipient: 'sent' | 'failed' | 'not_configured'
    purchaser: 'sent' | 'failed' | 'not_configured' | 'same_recipient'
  }
}

type BalanceResult = {
  lastFour: string
  balanceCents: number
  currency: string
  status: 'active' | 'inactive' | 'expired'
  expiresAt: string | null
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

const pageCopy: Record<
  Locale,
  {
    back: string
    eyebrow: string
    title: string
    intro: string
    amount: string
    customAmount: string
    fromName: string
    fromEmail: string
    toName: string
    toEmail: string
    message: string
    payment: string
    buy: string
    processing: string
    unavailable: string
    failed: string
    success: string
    share: string
    copy: string
    copied: string
    balanceTitle: string
    balanceIntro: string
    code: string
    check: string
    balance: string
    status: string
    active: string
    inactive: string
    expired: string
    invalid: string
  }
> = {
  zh: { back: '返回首页', eyebrow: '送一份安静与呵护', title: 'ORA 礼品卡', intro: '为朋友送上一段专属的头疗与放松时光。购买后即可分享礼品卡卡号，并可在门店消费时使用。', amount: '选择金额', customAmount: '自定义金额', fromName: '购买人姓名', fromEmail: '购买人邮箱', toName: '收卡人姓名', toEmail: '收卡人邮箱', message: '祝福语（可选）', payment: 'Square 安全支付', buy: '购买礼品卡', processing: '正在处理付款...', unavailable: '在线付款暂未启用，请联系门店购买礼品卡。', failed: '购买失败，请检查付款信息后重试。', success: '礼品卡购买成功', share: '分享给朋友', copy: '复制卡号', copied: '卡号已复制', balanceTitle: '查询礼品卡余额', balanceIntro: '输入完整卡号查看当前可用余额。', code: '礼品卡卡号', check: '查询余额', balance: '可用余额', status: '状态', active: '可使用', inactive: '已停用', expired: '已过期', invalid: '未找到该礼品卡，请检查卡号。' },
  'zh-TW': { back: '返回首頁', eyebrow: '送一份安靜與呵護', title: 'ORA 禮品卡', intro: '為朋友送上一段專屬的頭療與放鬆時光。購買後即可分享禮品卡卡號，並可在門店消費時使用。', amount: '選擇金額', customAmount: '自訂金額', fromName: '購買人姓名', fromEmail: '購買人郵箱', toName: '收卡人姓名', toEmail: '收卡人郵箱', message: '祝福語（可選）', payment: 'Square 安全支付', buy: '購買禮品卡', processing: '正在處理付款...', unavailable: '線上付款暫未啟用，請聯絡門店購買禮品卡。', failed: '購買失敗，請檢查付款資訊後重試。', success: '禮品卡購買成功', share: '分享給朋友', copy: '複製卡號', copied: '卡號已複製', balanceTitle: '查詢禮品卡餘額', balanceIntro: '輸入完整卡號查看目前可用餘額。', code: '禮品卡卡號', check: '查詢餘額', balance: '可用餘額', status: '狀態', active: '可使用', inactive: '已停用', expired: '已過期', invalid: '找不到該禮品卡，請檢查卡號。' },
  en: { back: 'Back home', eyebrow: 'Give time to unwind', title: 'ORA Gift Cards', intro: 'Share a restorative head spa experience with someone special. Send the card code after purchase and redeem it in store.', amount: 'Choose an amount', customAmount: 'Custom amount', fromName: 'Your name', fromEmail: 'Your email', toName: 'Recipient name', toEmail: 'Recipient email', message: 'Personal message (optional)', payment: 'Secure Square Payment', buy: 'Purchase gift card', processing: 'Processing payment...', unavailable: 'Online payment is not enabled yet. Please contact the spa to purchase a gift card.', failed: 'Purchase failed. Check your payment details and try again.', success: 'Your gift card is ready', share: 'Share with a friend', copy: 'Copy code', copied: 'Code copied', balanceTitle: 'Check gift card balance', balanceIntro: 'Enter the full card code to see the available balance.', code: 'Gift card code', check: 'Check balance', balance: 'Available balance', status: 'Status', active: 'Active', inactive: 'Inactive', expired: 'Expired', invalid: 'Gift card not found. Check the code and try again.' },
  es: { back: 'Volver al inicio', eyebrow: 'Regala tiempo para relajarse', title: 'Tarjetas regalo ORA', intro: 'Comparte una experiencia restauradora de spa capilar. Envía el código después de comprar y úsalo en la tienda.', amount: 'Elegir importe', customAmount: 'Importe personalizado', fromName: 'Tu nombre', fromEmail: 'Tu correo electrónico', toName: 'Nombre del destinatario', toEmail: 'Correo electrónico del destinatario', message: 'Mensaje personal (opcional)', payment: 'Pago seguro con Square', buy: 'Comprar tarjeta regalo', processing: 'Procesando el pago...', unavailable: 'El pago en línea aún no está habilitado. Contacta con el spa.', failed: 'La compra falló. Revisa el pago e inténtalo de nuevo.', success: 'Tu tarjeta regalo está lista', share: 'Compartir con un amigo', copy: 'Copiar código', copied: 'Código copiado', balanceTitle: 'Consultar saldo', balanceIntro: 'Introduce el código completo para ver el saldo disponible.', code: 'Código de tarjeta', check: 'Consultar saldo', balance: 'Saldo disponible', status: 'Estado', active: 'Activa', inactive: 'Inactiva', expired: 'Caducada', invalid: 'No se encontró la tarjeta. Revisa el código.' },
  fr: { back: 'Retour à l’accueil', eyebrow: 'Offrez un moment de détente', title: 'Cartes cadeaux ORA', intro: 'Partagez une expérience régénérante de spa capillaire. Envoyez le code après l’achat et utilisez-le en boutique.', amount: 'Choisir un montant', customAmount: 'Montant personnalisé', fromName: 'Votre nom', fromEmail: 'Votre e-mail', toName: 'Nom du destinataire', toEmail: 'E-mail du destinataire', message: 'Message personnel (facultatif)', payment: 'Paiement sécurisé Square', buy: 'Acheter la carte cadeau', processing: 'Paiement en cours...', unavailable: 'Le paiement en ligne n’est pas encore activé. Contactez le spa.', failed: 'Échec de l’achat. Vérifiez le paiement et réessayez.', success: 'Votre carte cadeau est prête', share: 'Partager avec un proche', copy: 'Copier le code', copied: 'Code copié', balanceTitle: 'Consulter le solde', balanceIntro: 'Saisissez le code complet pour afficher le solde disponible.', code: 'Code de la carte', check: 'Consulter', balance: 'Solde disponible', status: 'Statut', active: 'Active', inactive: 'Inactive', expired: 'Expirée', invalid: 'Carte introuvable. Vérifiez le code.' },
  ja: { back: 'ホームへ戻る', eyebrow: '癒やしの時間を贈る', title: 'ORA ギフトカード', intro: '大切な方へヘッドスパの癒やしを。購入後にカードコードを共有し、店舗でのお支払いにご利用いただけます。', amount: '金額を選択', customAmount: '金額を入力', fromName: '購入者名', fromEmail: '購入者メール', toName: '受取人名', toEmail: '受取人メール', message: 'メッセージ（任意）', payment: 'Squareによる安全な決済', buy: 'ギフトカードを購入', processing: '決済処理中...', unavailable: 'オンライン決済は現在利用できません。店舗へお問い合わせください。', failed: '購入できませんでした。決済情報をご確認ください。', success: 'ギフトカードを購入しました', share: '友達に共有', copy: 'コードをコピー', copied: 'コピーしました', balanceTitle: '残高を確認', balanceIntro: 'カードコードを入力して利用可能残高を確認できます。', code: 'ギフトカードコード', check: '残高確認', balance: '利用可能残高', status: '状態', active: '利用可能', inactive: '停止中', expired: '期限切れ', invalid: 'カードが見つかりません。コードをご確認ください。' },
  ko: { back: '홈으로', eyebrow: '휴식의 시간을 선물하세요', title: 'ORA 기프트 카드', intro: '소중한 분께 헤드 스파 경험을 선물하세요. 구매 후 코드를 공유하고 매장에서 사용할 수 있습니다.', amount: '금액 선택', customAmount: '직접 입력', fromName: '구매자 이름', fromEmail: '구매자 이메일', toName: '받는 분 이름', toEmail: '받는 분 이메일', message: '메시지 (선택)', payment: 'Square 안전 결제', buy: '기프트 카드 구매', processing: '결제 처리 중...', unavailable: '온라인 결제가 아직 활성화되지 않았습니다. 매장에 문의해 주세요.', failed: '구매에 실패했습니다. 결제 정보를 확인해 주세요.', success: '기프트 카드가 준비되었습니다', share: '친구에게 공유', copy: '코드 복사', copied: '복사됨', balanceTitle: '잔액 확인', balanceIntro: '전체 카드 코드를 입력해 사용 가능한 잔액을 확인하세요.', code: '기프트 카드 코드', check: '잔액 확인', balance: '사용 가능 잔액', status: '상태', active: '사용 가능', inactive: '사용 중지', expired: '만료됨', invalid: '카드를 찾을 수 없습니다. 코드를 확인해 주세요.' },
  de: { back: 'Zur Startseite', eyebrow: 'Zeit zum Entspannen schenken', title: 'ORA Geschenkkarten', intro: 'Verschenken Sie eine erholsame Kopfhautpflege. Teilen Sie nach dem Kauf den Kartencode und lösen Sie ihn vor Ort ein.', amount: 'Betrag wählen', customAmount: 'Eigener Betrag', fromName: 'Ihr Name', fromEmail: 'Ihre E-Mail', toName: 'Name der beschenkten Person', toEmail: 'E-Mail der beschenkten Person', message: 'Persönliche Nachricht (optional)', payment: 'Sichere Square-Zahlung', buy: 'Geschenkkarte kaufen', processing: 'Zahlung wird verarbeitet...', unavailable: 'Online-Zahlung ist noch nicht aktiviert. Bitte kontaktieren Sie das Spa.', failed: 'Kauf fehlgeschlagen. Prüfen Sie die Zahlungsdaten.', success: 'Ihre Geschenkkarte ist bereit', share: 'Mit Freunden teilen', copy: 'Code kopieren', copied: 'Code kopiert', balanceTitle: 'Guthaben prüfen', balanceIntro: 'Geben Sie den vollständigen Kartencode ein.', code: 'Geschenkkartencode', check: 'Guthaben prüfen', balance: 'Verfügbares Guthaben', status: 'Status', active: 'Aktiv', inactive: 'Inaktiv', expired: 'Abgelaufen', invalid: 'Geschenkkarte nicht gefunden. Prüfen Sie den Code.' },
  ru: { back: 'На главную', eyebrow: 'Подарите время для отдыха', title: 'Подарочные карты ORA', intro: 'Подарите близкому человеку восстанавливающий СПА-уход за кожей головы. После покупки отправьте код карты, который можно использовать в салоне.', amount: 'Выберите сумму', customAmount: 'Другая сумма', fromName: 'Ваше имя', fromEmail: 'Ваша электронная почта', toName: 'Имя получателя', toEmail: 'Электронная почта получателя', message: 'Личное сообщение (необязательно)', payment: 'Безопасная оплата через Square', buy: 'Купить подарочную карту', processing: 'Обработка платежа...', unavailable: 'Онлайн-оплата пока не подключена. Свяжитесь с салоном.', failed: 'Покупка не удалась. Проверьте данные оплаты.', success: 'Подарочная карта готова', share: 'Поделиться с другом', copy: 'Копировать код', copied: 'Код скопирован', balanceTitle: 'Проверить баланс', balanceIntro: 'Введите полный код карты, чтобы увидеть доступный баланс.', code: 'Код подарочной карты', check: 'Проверить баланс', balance: 'Доступный баланс', status: 'Статус', active: 'Активна', inactive: 'Неактивна', expired: 'Истекла', invalid: 'Карта не найдена. Проверьте код.' },
}

const deliveryCopy: Record<
  Locale,
  { sent: (email: string) => string; failed: string }
> = {
  zh: {
    sent: (email) => `礼品卡邮件已发送至 ${email}。`,
    failed: '礼品卡邮件未能发送，请复制卡号并直接分享给接收者。',
  },
  'zh-TW': {
    sent: (email) => `禮品卡郵件已發送至 ${email}。`,
    failed: '禮品卡郵件未能發送，請複製卡號並直接分享給接收者。',
  },
  en: {
    sent: (email) => `The gift card email was sent to ${email}.`,
    failed:
      'The gift card email could not be sent. Copy the code and share it with the recipient.',
  },
  es: {
    sent: (email) => `El correo de la tarjeta se envió a ${email}.`,
    failed:
      'No se pudo enviar el correo. Copia el código y compártelo con el destinatario.',
  },
  fr: {
    sent: (email) => `L’e-mail de la carte a été envoyé à ${email}.`,
    failed:
      'L’e-mail n’a pas pu être envoyé. Copiez le code et partagez-le avec le destinataire.',
  },
  ja: {
    sent: (email) => `ギフトカードのメールを ${email} に送信しました。`,
    failed:
      'メールを送信できませんでした。コードをコピーして受取人に共有してください。',
  },
  ko: {
    sent: (email) => `기프트 카드 이메일을 ${email} 주소로 보냈습니다.`,
    failed:
      '이메일을 보내지 못했습니다. 코드를 복사해 받는 분에게 직접 전달해 주세요.',
  },
  de: {
    sent: (email) => `Die Geschenkkarten-E-Mail wurde an ${email} gesendet.`,
    failed:
      'Die E-Mail konnte nicht gesendet werden. Kopieren Sie den Code und teilen Sie ihn direkt.',
  },
  ru: {
    sent: (email) => `Письмо с подарочной картой отправлено на ${email}.`,
    failed:
      'Не удалось отправить письмо. Скопируйте код и передайте его получателю.',
  },
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default function GiftCards() {
  const locale = useSiteStore((state) => state.locale)
  const t = pageCopy[locale]
  const customerLabels = customerCopy[locale]
  const { session, openAuth } = useCustomerAuth()
  const [amount, setAmount] = useState(100)
  const [customAmount, setCustomAmount] = useState('')
  const [purchaserName, setPurchaserName] = useState('')
  const [purchaserEmail, setPurchaserEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [personalMessage, setPersonalMessage] = useState('')
  const [config, setConfig] = useState<SquareConfig | null>(null)
  const cardRef = useRef<SquareCard | null>(null)
  const [paymentReady, setPaymentReady] = useState(false)
  const [paymentLoadFailed, setPaymentLoadFailed] = useState(false)
  const [result, setResult] = useState<PurchaseResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [balanceCode, setBalanceCode] = useState('')
  const [balance, setBalance] = useState<BalanceResult | null>(null)
  const [balanceMessage, setBalanceMessage] = useState('')

  useEffect(() => {
    fetch('/api/square-config')
      .then((response) => response.json())
      .then((data: SquareConfig) => setConfig(data))
      .catch(() => setConfig(null))
  }, [])

  useEffect(() => {
    const email = session?.user.email
    if (!email) return
    setPurchaserEmail(email)
    setMessage((current) =>
      current === customerLabels.loginToPay
        ? customerLabels.continuePayment
        : current,
    )
  }, [
    customerLabels.continuePayment,
    customerLabels.loginToPay,
    session,
  ])

  useEffect(() => {
    if (
      !config?.enabled ||
      !config.applicationId ||
      !config.locationId ||
      result
    ) {
      return
    }

    let cancelled = false
    let card: SquareCard | null = null
    const scriptUrl =
      config.environment === 'production'
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
        config.applicationId,
        config.locationId,
      )
      card = await payments.card()
      if (cancelled) {
        await card.destroy()
        return
      }
      await card.attach('#gift-card-square')
      cardRef.current = card
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
      if (cardRef.current === card) cardRef.current = null
      if (card) void card.destroy()
    }
  }, [
    config?.applicationId,
    config?.enabled,
    config?.environment,
    config?.locationId,
    result,
  ])

  const tokenize = async (amountCents: number) => {
    if (!cardRef.current || !paymentReady) {
      throw new Error('square_not_ready')
    }

    const token = await cardRef.current.tokenize({
      amount: (amountCents / 100).toFixed(2),
      billingContact: {
        givenName: purchaserName,
        email: purchaserEmail,
        countryCode: 'US',
      },
      currencyCode: 'USD',
      intent: 'CHARGE',
      customerInitiated: true,
      sellerKeyedIn: false,
    })
    if (token.status !== 'OK' || !token.token) {
      throw new Error(
        token.errors?.map((error) => error.message).join('; ') ||
          'card_token_failed',
      )
    }
    return token.token
  }

  const purchase = async (event: FormEvent) => {
    event.preventDefault()
    const selectedAmount = customAmount ? Number(customAmount) : amount
    const amountCents = Math.round(selectedAmount * 100)
    if (amountCents < 2500 || amountCents > 100000) return

    if (!session) {
      setMessage(customerLabels.loginToPay)
      openAuth('sign-in', {
        email: purchaserEmail,
        name: purchaserName,
      })
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const sourceId = await tokenize(amountCents)
      const response = await fetch('/api/gift-card-purchase', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountCents,
          purchaserName,
          purchaserEmail,
          recipientName,
          recipientEmail,
          personalMessage,
          locale,
          sourceId,
          idempotencyKey: crypto.randomUUID(),
        }),
      })
      const data = await response.json()
      if (response.status === 401 || response.status === 403) {
        setMessage(customerLabels.loginToPay)
        openAuth('sign-in', { email: purchaserEmail })
        return
      }
      if (!response.ok) throw new Error(data.error ?? 'purchase_failed')
      setResult(data)
    } catch {
      setMessage(config?.enabled ? t.failed : t.unavailable)
    } finally {
      setLoading(false)
    }
  }

  const share = async () => {
    if (!result) return
    const text = `${t.success}\n${result.recipientName}\n${money(result.amountCents)}\n${result.code}${result.personalMessage ? `\n${result.personalMessage}` : ''}`
    if (navigator.share) {
      await navigator.share({ title: t.title, text })
    } else {
      await navigator.clipboard.writeText(text)
      setMessage(t.copied)
    }
  }

  const checkBalance = async (event: FormEvent) => {
    event.preventDefault()
    setBalance(null)
    setBalanceMessage('')
    try {
      const response = await fetch(
        `/api/gift-cards?code=${encodeURIComponent(balanceCode)}`,
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setBalance(data)
    } catch {
      setBalanceMessage(t.invalid)
    }
  }

  return (
    <main className="gift-card-page">
      <Header
        actionHref={`/?lang=${locale}`}
        actionLabel={t.back}
        returnToHome
      />

      <section className="gift-card-hero">
        <img src={images.interiorHall} alt="" />
        <div>
          <p>{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <span>{t.intro}</span>
        </div>
      </section>

      <section className="gift-card-purchase">
        {result ? (
          <div className="gift-card-success">
            <Check size={30} />
            <h2>{t.success}</h2>
            <div className="gift-card-visual">
              <span>{siteCopy[locale].hero.eyebrow}</span>
              <strong>{money(result.amountCents)}</strong>
              <p>{result.recipientName}</p>
              <code>{result.code}</code>
              {result.personalMessage && <em>{result.personalMessage}</em>}
            </div>
            <div>
              <button type="button" onClick={() => void share()}>
                <Share2 size={16} />
                {t.share}
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(result.code)
                  setMessage(t.copied)
                }}
              >
                <Copy size={16} />
                {t.copy}
              </button>
            </div>
            {result.emailDelivery && (
              <p
                className={
                  result.emailDelivery.recipient === 'sent'
                    ? 'gift-card-email-status'
                    : 'gift-card-error'
                }
              >
                {result.emailDelivery.recipient === 'sent'
                  ? deliveryCopy[locale].sent(result.recipientEmail)
                  : deliveryCopy[locale].failed}
              </p>
            )}
            {message && <p>{message}</p>}
          </div>
        ) : (
          <form onSubmit={purchase}>
            <fieldset>
              <legend>{t.amount}</legend>
              <div className="gift-card-amounts">
                {[50, 100, 150, 200].map((value) => (
                  <button
                    className={!customAmount && amount === value ? 'is-active' : ''}
                    type="button"
                    key={value}
                    onClick={() => {
                      setAmount(value)
                      setCustomAmount('')
                    }}
                  >
                    ${value}
                  </button>
                ))}
              </div>
              <label>
                <span>{t.customAmount}</span>
                <input
                  type="number"
                  min="25"
                  max="1000"
                  step="1"
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value)}
                />
              </label>
            </fieldset>
            <div className="gift-card-fields">
              <label>
                <span>{t.fromName}</span>
                <input required value={purchaserName} onChange={(event) => setPurchaserName(event.target.value)} />
              </label>
              <label>
                <span>{t.fromEmail}</span>
                <input required readOnly={Boolean(session)} type="email" value={purchaserEmail} onChange={(event) => setPurchaserEmail(event.target.value)} />
              </label>
              <label>
                <span>{t.toName}</span>
                <input required value={recipientName} onChange={(event) => setRecipientName(event.target.value)} />
              </label>
              <label>
                <span>{t.toEmail}</span>
                <input required type="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} />
              </label>
            </div>
            <label>
              <span>{t.message}</span>
              <textarea maxLength={500} value={personalMessage} onChange={(event) => setPersonalMessage(event.target.value)} />
            </label>
            <div className="gift-card-payment">
              <strong><CreditCard size={18} />{t.payment}</strong>
              {config?.enabled ? <div id="gift-card-square" /> : <p>{t.unavailable}</p>}
            </div>
            {paymentLoadFailed && (
              <p className="gift-card-error">{t.failed}</p>
            )}
            {message && <p className="gift-card-error">{message}</p>}
            <button
              type="submit"
              disabled={loading || !config?.enabled || !paymentReady}
            >
              <Gift size={17} />
              {loading ? t.processing : t.buy}
            </button>
          </form>
        )}
      </section>

      <section className="gift-card-balance" id="gift-card-balance">
        <div>
          <h2>{t.balanceTitle}</h2>
          <p>{t.balanceIntro}</p>
        </div>
        <form onSubmit={checkBalance}>
          <label>
            <span>{t.code}</span>
            <input
              required
              placeholder="ORA-XXXX-XXXX-XXXX"
              value={balanceCode}
              onChange={(event) => setBalanceCode(event.target.value.toUpperCase())}
            />
          </label>
          <button type="submit">{t.check}</button>
        </form>
        {balance && (
          <dl>
            <div><dt>{t.balance}</dt><dd>{money(balance.balanceCents)}</dd></div>
            <div><dt>{t.status}</dt><dd>{t[balance.status]}</dd></div>
          </dl>
        )}
        {balanceMessage && <p className="gift-card-error">{balanceMessage}</p>}
      </section>
    </main>
  )
}
