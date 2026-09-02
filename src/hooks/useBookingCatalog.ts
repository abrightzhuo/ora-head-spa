import { useCallback, useEffect, useState } from 'react'
import type { Locale } from '../store/useSiteStore'

export type ProviderLocalization = {
  headline: string
  bio: string
  specialties: string[]
}

export type BookingService = {
  id: string
  code: string
  name: string
  name_zh: string | null
  description: string
  description_zh: string | null
  what_to_expect: string[]
  duration_minutes: number
  price_cents: number
  display_order: number
}

export type BookingProvider = {
  id: string
  display_name: string
  bio: string | null
  profile_headline: string | null
  profile_headline_zh: string | null
  photo_url: string | null
  specialties: string[]
  specialties_zh: string[]
  languages: string[]
  experience_years: number | null
  bio_zh: string | null
  localizations: Partial<Record<Locale, ProviderLocalization>>
  color: string
  service_ids: string[]
}

export function providerTranslation(
  provider: BookingProvider,
  locale: Locale,
) {
  return (
    provider.localizations?.[locale] ??
    provider.localizations?.en ?? {
      headline: provider.profile_headline ?? '',
      bio: provider.bio ?? '',
      specialties: provider.specialties ?? [],
    }
  )
}

export type BookingSettings = {
  business_name: string
  timezone: string
  location: string
  booking_window_days: number
  cancellation_policy: string | null
}

export type BookingCatalog = {
  settings: BookingSettings
  services: BookingService[]
  providers: BookingProvider[]
}

export function useBookingCatalog() {
  const [catalog, setCatalog] = useState<BookingCatalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const response = await fetch('/api/catalog')
      const result = (await response.json()) as BookingCatalog
      if (!response.ok) throw new Error('catalog_unavailable')
      setCatalog(result)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { catalog, loading, error, reload: load }
}
