const copy = {
  zh: {
    subject: 'ORA 预约确认',
    title: '您的预约已确认',
    welcome: (name) => `${name}，感谢您的预约。`,
    lookForward: 'We look forward to welcoming you to ORA TOUCHEER.',
    service: '服务项目',
    provider: '技师',
    date: '日期与时间',
    location: '门店地址',
    price: '预约价格',
    card: '已保存付款方式',
    policy: '取消政策',
    before: '到店前须知',
    manage: '查看或取消预约',
    sms: (service, date) =>
      `ORA预约确认：${service}，${date}。查看或取消预约：`,
  },
  en: {
    subject: 'ORA Booking Confirmation',
    title: 'Your booking is confirmed',
    welcome: (name) => `Thank you for booking with us, ${name}.`,
    lookForward: 'We look forward to welcoming you to ORA TOUCHEER.',
    service: 'Service',
    provider: 'Provider',
    date: 'Date & time',
    location: 'Location',
    price: 'Price',
    card: 'Saved payment method',
    policy: 'Cancellation policy',
    before: 'Before your visit',
    manage: 'View or cancel appointment',
    sms: (service, date) =>
      `ORA booking confirmed: ${service}, ${date}. View or cancel:`,
  },
}

function selectedCopy(locale) {
  return locale === 'zh' || locale === 'zh-TW' ? copy.zh : copy.en
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function siteUrl() {
  return (
    process.env.PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://www.myoraspa.com')
  ).replace(/\/+$/, '')
}

function formatAppointmentTime(value, locale) {
  return new Intl.DateTimeFormat(
    locale === 'zh' || locale === 'zh-TW' ? 'zh-CN' : 'en-US',
    {
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'short',
    },
  ).format(new Date(value))
}

function money(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(cents ?? 0) / 100)
}

function normalizeUsPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return String(value ?? '').trim()
}

async function sendEmail({ to, subject, html, idempotencyKey }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) return { status: 'not_configured' }

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
    return response.ok
      ? { status: 'sent', id: result.id ?? null }
      : { status: 'failed', error: result.message ?? 'resend_failed' }
  } catch (error) {
    return { status: 'failed', error: error.message }
  }
}

async function sendSms({ to, body }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER
  if (!accountSid || !authToken || !from) {
    return { status: 'not_configured' }
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${accountSid}:${authToken}`,
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: from,
          To: normalizeUsPhone(to),
          Body: body,
        }),
      },
    )
    const result = await response.json().catch(() => ({}))
    return response.ok
      ? { status: 'sent', id: result.sid ?? null }
      : { status: 'failed', error: result.message ?? 'twilio_failed' }
  } catch (error) {
    return { status: 'failed', error: error.message }
  }
}

export async function sendBookingConfirmation({
  appointmentId,
  locale,
  email,
  phone,
  payload,
}) {
  const t = selectedCopy(locale)
  const manageUrl = `${siteUrl()}/account?lang=${encodeURIComponent(
    locale,
  )}#appointments`
  const appointmentTime = formatAppointmentTime(payload.starts_at, locale)
  const card = payload.card_on_file?.card_last_four
    ? `${payload.card_on_file.card_brand ?? 'Card'} •••• ${
        payload.card_on_file.card_last_four
      }`
    : '—'
  const rows = [
    [t.service, payload.service],
    [t.provider, payload.provider],
    [t.date, appointmentTime],
    [t.location, payload.location],
    [t.price, money(payload.price_cents)],
    [t.card, card],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:7px 14px 7px 0;color:#786b59">${escapeHtml(
          label,
        )}</td><td style="padding:7px 0;font-weight:600">${escapeHtml(
          value,
        )}</td></tr>`,
    )
    .join('')
  const visitItems = (payload.before_your_visit ?? [])
    .map((item) => `<li style="margin:5px 0">${escapeHtml(item)}</li>`)
    .join('')
  const html = `
    <div style="background:#f7f3ec;padding:28px;font-family:Arial,sans-serif;color:#30291f">
      <div style="max-width:620px;margin:auto;background:#fffdf8;padding:32px;border:1px solid #e4d7c4">
        <p style="margin:0 0 8px;color:#8a672e;font-size:12px;letter-spacing:1px">ORA TOUCHEER</p>
        <h1 style="margin:0 0 18px;font-size:28px;font-weight:500">${escapeHtml(
          t.title,
        )}</h1>
        <p>${escapeHtml(t.welcome(payload.customer_name))}</p>
        <p>${escapeHtml(t.lookForward)}</p>
        <table style="width:100%;margin:24px 0;border-collapse:collapse">${rows}</table>
        <h2 style="font-size:18px;margin:24px 0 8px">${escapeHtml(
          t.before,
        )}</h2>
        <ul style="padding-left:20px;line-height:1.55">${visitItems}</ul>
        <h2 style="font-size:18px;margin:24px 0 8px">${escapeHtml(
          t.policy,
        )}</h2>
        <p style="line-height:1.55">${escapeHtml(
          payload.cancellation_policy ?? '',
        )}</p>
        <p style="margin:26px 0 8px">
          <a href="${escapeHtml(
            manageUrl,
          )}" style="display:inline-block;padding:12px 18px;background:#76552b;color:#fff;text-decoration:none">${escapeHtml(
            t.manage,
          )}</a>
        </p>
      </div>
    </div>`

  const [emailResult, smsResult] = await Promise.all([
    sendEmail({
      to: email,
      subject: t.subject,
      html,
      idempotencyKey: `booking-${appointmentId}-confirmation`,
    }),
    sendSms({
      to: phone,
      body: `${t.sms(payload.service, appointmentTime)} ${manageUrl}`,
    }),
  ])

  return { email: emailResult, sms: smsResult }
}
