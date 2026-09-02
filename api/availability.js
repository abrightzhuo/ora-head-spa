import { getServerClient, json } from './_lib/supabase.js'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const datePattern = /^\d{4}-\d{2}-\d{2}$/

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const serviceId =
    typeof request.query.serviceId === 'string'
      ? request.query.serviceId
      : ''
  const providerId =
    typeof request.query.providerId === 'string'
      ? request.query.providerId
      : ''
  const date = typeof request.query.date === 'string' ? request.query.date : ''

  if (
    !uuidPattern.test(serviceId) ||
    (providerId && !uuidPattern.test(providerId)) ||
    !datePattern.test(date)
  ) {
    return json(response, 400, { error: 'invalid_input' })
  }

  const adminClient = getServerClient()
  if (!adminClient) {
    return json(response, 500, { error: 'server_not_configured' })
  }

  const { data, error } = await adminClient.rpc('get_available_slots', {
    requested_date: date,
    requested_service: serviceId,
    requested_provider: providerId || null,
  })

  if (error) {
    return json(response, 500, { error: 'availability_unavailable' })
  }

  const slotsByStart = new Map()
  for (const slot of data ?? []) {
    const existing = slotsByStart.get(slot.starts_at)
    if (existing) {
      existing.providers.push({
        id: slot.provider_id,
        name: slot.provider_name,
      })
      continue
    }

    slotsByStart.set(slot.starts_at, {
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      providers: [
        {
          id: slot.provider_id,
          name: slot.provider_name,
        },
      ],
    })
  }

  response.setHeader(
    'Cache-Control',
    'private, no-store, max-age=0',
  )
  return json(response, 200, { slots: [...slotsByStart.values()] })
}
