export const EASTERN_TIME_ZONE = 'America/New_York'

type DateValue = Date | number | string

function localeFor(value: string) {
  return value === 'zh' || value === 'zh-TW' ? value : value
}

export function formatEasternDateTime(
  value: DateValue,
  locale: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(localeFor(locale), {
    ...options,
    timeZone: EASTERN_TIME_ZONE,
  }).format(new Date(value))
}

export function easternDateKey(value: DateValue = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EASTERN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return `${get('year')}-${get('month')}-${get('day')}`
}

export function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function formatDateKey(
  dateKey: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(localeFor(locale), {
    ...options,
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T12:00:00Z`))
}

export function easternInputValue(value: DateValue | null) {
  if (!value) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EASTERN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return (
    `${get('year')}-${get('month')}-${get('day')}T` +
    `${get('hour')}:${get('minute')}`
  )
}

function timeZoneOffset(timestamp: number) {
  const date = new Date(timestamp)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)
  const representedAsUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )

  return representedAsUtc - Math.floor(timestamp / 1000) * 1000
}

export function easternLocalDateTimeToIso(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  )
  if (!match) throw new Error('invalid_eastern_datetime')

  const [, year, month, day, hour, minute, second = '0'] = match
  const desiredWallTime = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  )
  let timestamp = desiredWallTime - timeZoneOffset(desiredWallTime)
  timestamp = desiredWallTime - timeZoneOffset(timestamp)

  return new Date(timestamp).toISOString()
}
