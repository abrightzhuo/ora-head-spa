import { createHash, randomBytes } from 'node:crypto'

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function normalizeGiftCardCode(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

export function isGiftCardCode(value) {
  return /^ORA[A-Z2-9]{12}$/.test(normalizeGiftCardCode(value))
}

export function hashGiftCardCode(value) {
  return createHash('sha256')
    .update(normalizeGiftCardCode(value))
    .digest('hex')
}

export function generateGiftCardCode() {
  const bytes = randomBytes(12)
  const body = Array.from(
    bytes,
    (byte) => alphabet[byte % alphabet.length],
  ).join('')

  return `ORA-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8)}`
}
