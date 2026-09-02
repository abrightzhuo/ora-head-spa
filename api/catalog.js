import { getServerClient, json } from './_lib/supabase.js'
import { providerLocalizations } from './_lib/provider-localizations.js'

const providerDefaults = {
  amelia: {
    photo_url: '/images/providers/amelia.jpg',
    profile_headline: 'Scalp Balance & Purifying Care Specialist',
    profile_headline_zh: '头皮平衡与净化护理技师',
    bio: 'Amelia combines careful scalp observation with precise cleansing and soothing techniques. Her calm, methodical approach is especially suited to guests experiencing oiliness, product buildup or an unbalanced scalp.',
    bio_zh:
      'Amelia 擅长通过细致的头皮观察，结合精准清洁与舒缓手法，帮助改善出油、产品堆积及头皮状态失衡。她的服务节奏沉稳细致，注重每位顾客当下的真实需求。',
    specialties: [
      'Scalp analysis',
      'Deep cleansing',
      'Oil and buildup care',
      'Scalp acupressure',
    ],
    specialties_zh: ['头皮分析', '深层清洁', '油脂与堆积护理', '头皮穴位按摩'],
    languages: ['English', 'Mandarin'],
    experience_years: 6,
  },
  chloe: {
    photo_url: '/images/providers/chloe.jpg',
    profile_headline: 'Hydration & Restorative Hair Care Specialist',
    profile_headline_zh: '补水修护与发丝养护技师',
    bio: 'Chloe is known for a warm, attentive service style and restorative rituals that support scalp comfort, hydration and soft, glossy hair. She creates an easy, welcoming experience for first-time head spa guests.',
    bio_zh:
      'Chloe 的服务风格温暖细致，擅长通过补水修护护理提升头皮舒适度，并帮助发丝恢复柔软与光泽。她尤其善于让第一次体验头疗的顾客感到轻松和安心。',
    specialties: [
      'Scalp hydration',
      'Restorative hair care',
      'Dry scalp comfort',
      'Gentle relaxation massage',
    ],
    specialties_zh: ['头皮补水', '发丝修护', '干燥头皮舒缓', '轻柔放松按摩'],
    languages: ['English', 'Mandarin'],
    experience_years: 4,
  },
  helen: {
    photo_url: '/images/providers/helen.jpg',
    profile_headline: 'Deep Relaxation & Tension Relief Specialist',
    profile_headline_zh: '深度放松与头颈肩舒缓技师',
    bio: 'Helen brings an experienced, intuitive touch to deeply relaxing head spa rituals. Her focused head, neck and shoulder techniques are designed for guests carrying stress, muscle tension or mental fatigue.',
    bio_zh:
      'Helen 拥有丰富的放松护理经验，手法沉稳而富有感知力。她专注于头部、颈部与肩部的深度舒缓，适合长期压力、肌肉紧张或精神疲劳的顾客。',
    specialties: [
      'Head, neck and shoulder relief',
      'Deep relaxation massage',
      'Pressure-point techniques',
      'Sensitive scalp care',
    ],
    specialties_zh: ['头颈肩舒缓', '深度放松按摩', '穴位按压手法', '敏感头皮护理'],
    languages: ['English', 'Mandarin'],
    experience_years: 9,
  },
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return json(response, 405, { error: 'method_not_allowed' })
  }

  const adminClient = getServerClient()
  if (!adminClient) {
    return json(response, 500, { error: 'server_not_configured' })
  }

  const [
    { data: settings, error: settingsError },
    { data: services, error: servicesError },
    { data: providers, error: providersError },
    { data: staffServices, error: staffServicesError },
  ] = await Promise.all([
    adminClient
      .from('business_settings')
      .select(
        'business_name, timezone, location, booking_window_days, cancellation_policy',
      )
      .eq('id', true)
      .single(),
    adminClient
      .from('services')
      .select(
        'id, code, name, name_zh, description, description_zh, what_to_expect, duration_minutes, price_cents, display_order',
      )
      .eq('active', true)
      .eq('online_bookable', true)
      .order('display_order'),
    adminClient
      .from('staff_profiles')
      .select(
        'id, display_name, bio, profile_headline, photo_url, specialties, languages, experience_years, color',
      )
      .eq('active', true)
      .eq('bookable', true)
      .order('display_name'),
    adminClient
      .from('staff_services')
      .select('staff_id, service_id')
      .eq('active', true),
  ])

  if (
    settingsError ||
    servicesError ||
    providersError ||
    staffServicesError
  ) {
    return json(response, 500, { error: 'catalog_unavailable' })
  }

  const serviceIdsByStaff = new Map()
  for (const relation of staffServices ?? []) {
    const serviceIds = serviceIdsByStaff.get(relation.staff_id) ?? []
    serviceIds.push(relation.service_id)
    serviceIdsByStaff.set(relation.staff_id, serviceIds)
  }

  return json(response, 200, {
    settings,
    services: services ?? [],
    providers: (providers ?? []).map((provider) => {
      const defaults =
        providerDefaults[provider.display_name.trim().toLowerCase()] ?? {}
      const defaultLocalizations =
        providerLocalizations[provider.display_name.trim().toLowerCase()] ?? {}
      const localizations = Object.fromEntries(
        Object.entries(defaultLocalizations).map(([locale, value]) => [
          locale,
          { ...value, specialties: [...value.specialties] },
        ]),
      )
      if (localizations.en && provider.profile_headline) {
        localizations.en = {
          ...localizations.en,
          headline: provider.profile_headline,
          bio: provider.bio || localizations.en.bio,
          specialties:
            provider.specialties?.length > 0
              ? provider.specialties
              : localizations.en.specialties,
        }
      }
      return {
        ...defaults,
        ...provider,
        photo_url: provider.photo_url || defaults.photo_url || null,
        profile_headline:
          provider.profile_headline || defaults.profile_headline || null,
        bio: provider.bio || defaults.bio || null,
        specialties:
          provider.specialties?.length > 0
            ? provider.specialties
            : defaults.specialties ?? [],
        languages:
          provider.languages?.length > 0
            ? provider.languages
            : defaults.languages ?? [],
        experience_years:
          provider.experience_years ?? defaults.experience_years ?? null,
        profile_headline_zh: defaults.profile_headline_zh ?? null,
        bio_zh: defaults.bio_zh ?? null,
        specialties_zh: defaults.specialties_zh ?? [],
        localizations,
        service_ids: serviceIdsByStaff.get(provider.id) ?? [],
      }
    }),
  })
}
