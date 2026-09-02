const copy = {
  zh: {
    recipientSubject: '您收到了一张 ORA 礼品卡',
    recipientTitle: '一份专属的放松时光',
    recipientIntro: (purchaserName) =>
      `${purchaserName} 为您送上了一张 ORA 礼品卡。`,
    purchaserSubject: 'ORA 礼品卡购买确认',
    purchaserTitle: '礼品卡已创建',
    purchaserIntro: (recipientName) =>
      `您为 ${recipientName} 购买的 ORA 礼品卡已创建，并已发送至收卡人邮箱。`,
    amount: '礼品卡金额',
    code: '礼品卡卡号',
    message: '祝福语',
    recipient: '收卡人',
    balance: '查询礼品卡余额',
    receipt: '查看 Square 付款凭证',
    instructions: '到店结账时出示此卡号即可使用。',
    sandbox: '这是 Sandbox 测试邮件，该礼品卡不可用于真实消费。',
    footer: 'ORA TOUCHEER 期待您的到来。',
  },
  'zh-TW': {
    recipientSubject: '您收到了一張 ORA 禮品卡',
    recipientTitle: '一份專屬的放鬆時光',
    recipientIntro: (purchaserName) =>
      `${purchaserName} 為您送上了一張 ORA 禮品卡。`,
    purchaserSubject: 'ORA 禮品卡購買確認',
    purchaserTitle: '禮品卡已建立',
    purchaserIntro: (recipientName) =>
      `您為 ${recipientName} 購買的 ORA 禮品卡已建立，並已寄送至收卡人郵箱。`,
    amount: '禮品卡金額',
    code: '禮品卡卡號',
    message: '祝福語',
    recipient: '收卡人',
    balance: '查詢禮品卡餘額',
    receipt: '查看 Square 付款憑證',
    instructions: '到店結帳時出示此卡號即可使用。',
    sandbox: '這是 Sandbox 測試郵件，該禮品卡不可用於真實消費。',
    footer: 'ORA TOUCHEER 期待您的到來。',
  },
  en: {
    recipientSubject: 'You received an ORA Gift Card',
    recipientTitle: 'A restorative experience, just for you',
    recipientIntro: (purchaserName) =>
      `${purchaserName} sent you an ORA Gift Card.`,
    purchaserSubject: 'Your ORA Gift Card purchase',
    purchaserTitle: 'Your gift card is ready',
    purchaserIntro: (recipientName) =>
      `The ORA Gift Card you purchased for ${recipientName} has been created and emailed to the recipient.`,
    amount: 'Gift card amount',
    code: 'Gift card code',
    message: 'Personal message',
    recipient: 'Recipient',
    balance: 'Check gift card balance',
    receipt: 'View Square receipt',
    instructions: 'Present this code when checking out in store.',
    sandbox:
      'This is a Sandbox test email. This gift card cannot be used for a real purchase.',
    footer: 'We look forward to welcoming you to ORA TOUCHEER.',
  },
  es: {
    recipientSubject: 'Has recibido una tarjeta regalo ORA',
    recipientTitle: 'Una experiencia reparadora para ti',
    recipientIntro: (purchaserName) =>
      `${purchaserName} te ha enviado una tarjeta regalo ORA.`,
    purchaserSubject: 'Confirmación de tu tarjeta regalo ORA',
    purchaserTitle: 'Tu tarjeta regalo está lista',
    purchaserIntro: (recipientName) =>
      `La tarjeta regalo ORA que compraste para ${recipientName} se ha creado y enviado por correo electrónico.`,
    amount: 'Importe de la tarjeta',
    code: 'Código de la tarjeta',
    message: 'Mensaje personal',
    recipient: 'Destinatario',
    balance: 'Consultar saldo',
    receipt: 'Ver recibo de Square',
    instructions: 'Presenta este código al pagar en el establecimiento.',
    sandbox:
      'Este es un correo de prueba de Sandbox. La tarjeta no se puede usar en una compra real.',
    footer: 'Esperamos darte la bienvenida en ORA TOUCHEER.',
  },
  fr: {
    recipientSubject: 'Vous avez reçu une carte cadeau ORA',
    recipientTitle: 'Une expérience apaisante rien que pour vous',
    recipientIntro: (purchaserName) =>
      `${purchaserName} vous a envoyé une carte cadeau ORA.`,
    purchaserSubject: 'Confirmation de votre carte cadeau ORA',
    purchaserTitle: 'Votre carte cadeau est prête',
    purchaserIntro: (recipientName) =>
      `La carte cadeau ORA achetée pour ${recipientName} a été créée et envoyée par e-mail.`,
    amount: 'Montant de la carte',
    code: 'Code de la carte',
    message: 'Message personnel',
    recipient: 'Destinataire',
    balance: 'Consulter le solde',
    receipt: 'Voir le reçu Square',
    instructions: 'Présentez ce code lors du paiement en boutique.',
    sandbox:
      'Ceci est un e-mail de test Sandbox. Cette carte ne peut pas être utilisée pour un achat réel.',
    footer: 'Nous avons hâte de vous accueillir chez ORA TOUCHEER.',
  },
  ja: {
    recipientSubject: 'ORAギフトカードが届きました',
    recipientTitle: 'あなただけの癒やしの時間',
    recipientIntro: (purchaserName) =>
      `${purchaserName}様からORAギフトカードが届きました。`,
    purchaserSubject: 'ORAギフトカード購入確認',
    purchaserTitle: 'ギフトカードを作成しました',
    purchaserIntro: (recipientName) =>
      `${recipientName}様へのORAギフトカードを作成し、受取人のメールアドレスへ送信しました。`,
    amount: 'ギフトカード金額',
    code: 'ギフトカードコード',
    message: 'メッセージ',
    recipient: '受取人',
    balance: '残高を確認',
    receipt: 'Squareの領収書を見る',
    instructions: '店舗でのお会計時にこのコードをご提示ください。',
    sandbox:
      'これはSandboxのテストメールです。実際のお支払いには利用できません。',
    footer: 'ORA TOUCHEERでお迎えできることを楽しみにしております。',
  },
  ko: {
    recipientSubject: 'ORA 기프트 카드가 도착했습니다',
    recipientTitle: '당신을 위한 편안한 시간',
    recipientIntro: (purchaserName) =>
      `${purchaserName} 님이 ORA 기프트 카드를 보냈습니다.`,
    purchaserSubject: 'ORA 기프트 카드 구매 확인',
    purchaserTitle: '기프트 카드가 준비되었습니다',
    purchaserIntro: (recipientName) =>
      `${recipientName} 님을 위한 ORA 기프트 카드가 생성되어 받는 분의 이메일로 전송되었습니다.`,
    amount: '기프트 카드 금액',
    code: '기프트 카드 코드',
    message: '메시지',
    recipient: '받는 분',
    balance: '잔액 확인',
    receipt: 'Square 영수증 보기',
    instructions: '매장에서 결제할 때 이 코드를 제시해 주세요.',
    sandbox:
      'Sandbox 테스트 이메일입니다. 실제 결제에는 사용할 수 없습니다.',
    footer: 'ORA TOUCHEER에서 만나 뵙기를 기대합니다.',
  },
  de: {
    recipientSubject: 'Sie haben eine ORA Geschenkkarte erhalten',
    recipientTitle: 'Eine erholsame Auszeit für Sie',
    recipientIntro: (purchaserName) =>
      `${purchaserName} hat Ihnen eine ORA Geschenkkarte gesendet.`,
    purchaserSubject: 'Bestätigung Ihrer ORA Geschenkkarte',
    purchaserTitle: 'Ihre Geschenkkarte ist bereit',
    purchaserIntro: (recipientName) =>
      `Die ORA Geschenkkarte für ${recipientName} wurde erstellt und per E-Mail versendet.`,
    amount: 'Geschenkkartenbetrag',
    code: 'Geschenkkartencode',
    message: 'Persönliche Nachricht',
    recipient: 'Beschenkte Person',
    balance: 'Guthaben prüfen',
    receipt: 'Square-Beleg ansehen',
    instructions: 'Zeigen Sie diesen Code beim Bezahlen vor Ort.',
    sandbox:
      'Dies ist eine Sandbox-Test-E-Mail. Die Karte kann nicht für einen echten Kauf verwendet werden.',
    footer: 'Wir freuen uns darauf, Sie bei ORA TOUCHEER willkommen zu heißen.',
  },
  ru: {
    recipientSubject: 'Вы получили подарочную карту ORA',
    recipientTitle: 'Время отдыха специально для Вас',
    recipientIntro: (purchaserName) =>
      `${purchaserName} отправил(а) Вам подарочную карту ORA.`,
    purchaserSubject: 'Подтверждение покупки подарочной карты ORA',
    purchaserTitle: 'Подарочная карта готова',
    purchaserIntro: (recipientName) =>
      `Подарочная карта ORA для ${recipientName} создана и отправлена получателю по электронной почте.`,
    amount: 'Сумма карты',
    code: 'Код подарочной карты',
    message: 'Личное сообщение',
    recipient: 'Получатель',
    balance: 'Проверить баланс',
    receipt: 'Посмотреть квитанцию Square',
    instructions: 'Покажите этот код при оплате в салоне.',
    sandbox:
      'Это тестовое письмо Sandbox. Карту нельзя использовать для реальной покупки.',
    footer: 'Будем рады приветствовать Вас в ORA TOUCHEER.',
  },
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function money(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function emailLayout({
  title,
  intro,
  amountLabel,
  amountCents,
  codeLabel,
  code,
  details,
  instructions,
  sandboxNotice,
  balanceLabel,
  balanceUrl,
  receiptLabel,
  receiptUrl,
  footer,
}) {
  const detailRows = details
    .filter((item) => item.value)
    .map(
      (item) =>
        `<p style="margin:8px 0;color:#564a3b"><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</p>`,
    )
    .join('')
  const sandbox = sandboxNotice
    ? `<p style="margin:24px 0 0;padding:12px;border:1px solid #c99044;color:#7b4f16;background:#fff7e8">${escapeHtml(sandboxNotice)}</p>`
    : ''
  const receipt = receiptUrl
    ? `<a href="${escapeHtml(receiptUrl)}" style="color:#76552b">${escapeHtml(receiptLabel)}</a>`
    : ''

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4efe6;font-family:Arial,sans-serif;color:#30291f">
    <div style="max-width:620px;margin:0 auto;padding:38px 20px">
      <div style="background:#fffdf9;border:1px solid #ddd0bd;padding:34px">
        <p style="margin:0 0 18px;color:#8a6836;font-size:12px;letter-spacing:1.6px">ORA TOUCHEER</p>
        <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:30px;font-weight:400">${escapeHtml(title)}</h1>
        <p style="margin:0 0 26px;line-height:1.7;color:#564a3b">${escapeHtml(intro)}</p>
        <div style="padding:24px;border:1px solid #cdb68e;background:#fbf7ef;text-align:center">
          <p style="margin:0 0 8px;color:#75644e;font-size:12px;text-transform:uppercase">${escapeHtml(amountLabel)}</p>
          <strong style="display:block;font-family:Georgia,serif;font-size:34px;font-weight:400;color:#76552b">${escapeHtml(money(amountCents))}</strong>
          <p style="margin:24px 0 7px;color:#75644e;font-size:12px;text-transform:uppercase">${escapeHtml(codeLabel)}</p>
          <code style="font-size:20px;font-weight:700;letter-spacing:1.5px;color:#30291f">${escapeHtml(code)}</code>
        </div>
        <div style="margin-top:24px">${detailRows}</div>
        <p style="margin:22px 0;line-height:1.6">${escapeHtml(instructions)}</p>
        <p style="margin:22px 0">
          <a href="${escapeHtml(balanceUrl)}" style="display:inline-block;padding:12px 18px;background:#76552b;color:#fff;text-decoration:none">${escapeHtml(balanceLabel)}</a>
        </p>
        ${receipt}
        ${sandbox}
        <p style="margin:30px 0 0;padding-top:20px;border-top:1px solid #e5dccf;color:#75644e;font-size:13px">${escapeHtml(footer)}</p>
      </div>
    </div>
  </body>
</html>`
}

async function sendEmail({ to, subject, html, idempotencyKey }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) {
    return { status: 'not_configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        reply_to: process.env.RESEND_REPLY_TO_EMAIL || undefined,
      }),
    })
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('Resend email failed', {
        status: response.status,
        name: result.name,
        message: result.message,
      })
      return { status: 'failed' }
    }

    return { status: 'sent', id: result.id ?? null }
  } catch (error) {
    console.error('Resend email request failed', error)
    return { status: 'failed' }
  }
}

export async function sendGiftCardEmails({
  cardId,
  locale,
  environment,
  code,
  amountCents,
  purchaserName,
  purchaserEmail,
  recipientName,
  recipientEmail,
  personalMessage,
  receiptUrl,
}) {
  const selectedCopy = copy[locale] ?? copy.en
  const siteUrl = (
    process.env.PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://ora-head-spa.vercel.app')
  ).replace(/\/+$/, '')
  const balanceUrl = `${siteUrl}/gift-cards?lang=${encodeURIComponent(locale)}#gift-card-balance`
  const sandboxNotice =
    environment === 'production' ? null : selectedCopy.sandbox

  const recipientHtml = emailLayout({
    title: selectedCopy.recipientTitle,
    intro: selectedCopy.recipientIntro(purchaserName),
    amountLabel: selectedCopy.amount,
    amountCents,
    codeLabel: selectedCopy.code,
    code,
    details: [
      { label: selectedCopy.message, value: personalMessage },
    ],
    instructions: selectedCopy.instructions,
    sandboxNotice,
    balanceLabel: selectedCopy.balance,
    balanceUrl,
    receiptLabel: selectedCopy.receipt,
    receiptUrl: null,
    footer: selectedCopy.footer,
  })

  const recipientDelivery = await sendEmail({
    to: recipientEmail,
    subject: `${sandboxNotice ? '[TEST] ' : ''}${selectedCopy.recipientSubject}`,
    html: recipientHtml,
    idempotencyKey: `gift-card-${cardId}-recipient`,
  })

  if (purchaserEmail.toLowerCase() === recipientEmail.toLowerCase()) {
    return {
      recipient: recipientDelivery,
      purchaser: { status: 'same_recipient' },
    }
  }

  const purchaserHtml = emailLayout({
    title: selectedCopy.purchaserTitle,
    intro: selectedCopy.purchaserIntro(recipientName),
    amountLabel: selectedCopy.amount,
    amountCents,
    codeLabel: selectedCopy.code,
    code,
    details: [
      { label: selectedCopy.recipient, value: recipientName },
      { label: selectedCopy.message, value: personalMessage },
    ],
    instructions: selectedCopy.instructions,
    sandboxNotice,
    balanceLabel: selectedCopy.balance,
    balanceUrl,
    receiptLabel: selectedCopy.receipt,
    receiptUrl,
    footer: selectedCopy.footer,
  })
  const purchaserDelivery = await sendEmail({
    to: purchaserEmail,
    subject: `${sandboxNotice ? '[TEST] ' : ''}${selectedCopy.purchaserSubject}`,
    html: purchaserHtml,
    idempotencyKey: `gift-card-${cardId}-purchaser`,
  })

  return {
    recipient: recipientDelivery,
    purchaser: purchaserDelivery,
  }
}
