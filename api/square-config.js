import { json } from './_lib/supabase.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const applicationId = process.env.VITE_SQUARE_APPLICATION_ID
  const locationId =
    process.env.SQUARE_LOCATION_ID ?? process.env.VITE_SQUARE_LOCATION_ID
  const environment = process.env.SQUARE_ENVIRONMENT ?? 'sandbox'
  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const configured = Boolean(applicationId && locationId && accessToken)

  if (!configured) {
    return json(response, 200, {
      enabled: false,
      connected: false,
      applicationId: applicationId ?? null,
      locationId: locationId ?? null,
      environment,
      error: 'square_not_configured',
    })
  }

  const baseUrl =
    environment === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com'

  try {
    const squareResponse = await fetch(
      `${baseUrl}/v2/locations/${encodeURIComponent(locationId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2026-07-15',
        },
      },
    )
    const result = await squareResponse.json()

    if (!squareResponse.ok || !result.location) {
      return json(response, 200, {
        enabled: false,
        connected: false,
        applicationId,
        locationId,
        environment,
        error: result.errors?.[0]?.code ?? 'square_connection_failed',
      })
    }

    return json(response, 200, {
      enabled: true,
      connected: true,
      applicationId,
      locationId,
      environment,
      locationName: result.location.name ?? null,
      locationStatus: result.location.status ?? null,
      currency: result.location.currency ?? null,
      cardProcessing:
        result.location.capabilities?.includes('CREDIT_CARD_PROCESSING') ??
        false,
    })
  } catch {
    return json(response, 200, {
      enabled: false,
      connected: false,
      applicationId,
      locationId,
      environment,
      error: 'square_connection_failed',
    })
  }
}
