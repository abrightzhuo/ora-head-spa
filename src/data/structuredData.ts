import {
  BUSINESS,
  SERVICE_FACTS,
  absoluteUrl,
} from './business'
import type { FaqItem } from './faq'

type JsonLd = Record<string, unknown>

const ORGANIZATION_ID = `${BUSINESS.url}/#organization`
const BUSINESS_ID = `${BUSINESS.url}/#business`
const serviceId = (code: string) => `${BUSINESS.url}/#service-${code}`

const postalAddress = (): JsonLd => {
  const { streetAddress, addressLocality, addressRegion, postalCode, addressCountry } =
    BUSINESS.address
  const node: JsonLd = {
    '@type': 'PostalAddress',
    addressLocality,
    addressRegion,
    addressCountry,
  }
  if (streetAddress) node.streetAddress = streetAddress
  if (postalCode) node.postalCode = postalCode
  return node
}

export const organizationNode = (): JsonLd => {
  const node: JsonLd = {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: BUSINESS.parentBrand,
    legalName: BUSINESS.legalName,
    url: BUSINESS.url,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(BUSINESS.logo),
    },
    foundingDate: String(BUSINESS.foundingYear),
    description:
      'TOUCHEER is a herbal scalp and skin care brand founded in 1998, operating more than 10,000 locations across 5+ countries. ORA is its head spa in Waltham, Massachusetts.',
  }
  if (BUSINESS.sameAs.length) node.sameAs = BUSINESS.sameAs
  return node
}

export const serviceNodes = (): JsonLd[] =>
  SERVICE_FACTS.map((service) => ({
    '@type': 'Service',
    '@id': serviceId(service.code),
    name: service.name,
    alternateName: service.nameZh,
    serviceType: 'Head spa treatment',
    description: service.description,
    url: BUSINESS.url,
    provider: { '@id': BUSINESS_ID },
    areaServed: {
      '@type': 'City',
      name: 'Waltham',
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: 'Massachusetts',
      },
    },
    offers: {
      '@type': 'Offer',
      '@id': `${serviceId(service.code)}-offer`,
      price: service.price.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: BUSINESS.url,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: service.price.toFixed(2),
        priceCurrency: 'USD',
        unitText: `${service.durationMinutes} minutes`,
      },
    },
  }))

const offerNodes = (): JsonLd[] => [
  {
    '@type': 'Offer',
    '@id': `${BUSINESS.url}/#offer-membership`,
    // 结构化数据里用简短标签，产品全名（ORA Annual Membership）留给页面与对外文案
    name: 'Membership',
    description: BUSINESS.membership.description,
    url: absoluteUrl(BUSINESS.membership.url),
    price: BUSINESS.membership.price.toFixed(2),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    eligibleRegion: {
      '@type': 'AdministrativeArea',
      name: 'Massachusetts',
    },
  },
  {
    '@type': 'Offer',
    '@id': `${BUSINESS.url}/#offer-gift-card`,
    // 同会员：结构化数据用短标签，产品全名（ORA Gift Card）保留给页面与对外文案
    name: 'Gift Cards',
    description: BUSINESS.giftCard.description,
    url: absoluteUrl(BUSINESS.giftCard.url),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    priceSpecification: {
      '@type': 'PriceSpecification',
      minPrice: BUSINESS.giftCard.minPrice.toFixed(2),
      maxPrice: BUSINESS.giftCard.maxPrice.toFixed(2),
      priceCurrency: 'USD',
    },
  },
]

export const businessNode = (): JsonLd => {
  const node: JsonLd = {
    '@type': 'HealthAndBeautyBusiness',
    '@id': BUSINESS_ID,
    name: BUSINESS.legalName,
    alternateName: BUSINESS.alternateNames,
    description: BUSINESS.description,
    url: BUSINESS.url,
    image: BUSINESS.images.map(absoluteUrl),
    logo: absoluteUrl(BUSINESS.logo),
    priceRange: BUSINESS.priceRange,
    currenciesAccepted: 'USD',
    foundingDate: String(BUSINESS.foundingYear),
    parentOrganization: { '@id': ORGANIZATION_ID },
    address: postalAddress(),
    areaServed: [
      { '@type': 'City', name: 'Waltham' },
      { '@type': 'AdministrativeArea', name: 'Massachusetts' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: BUSINESS.openingHours.days.map(
          (day) => `https://schema.org/${day}`,
        ),
        opens: BUSINESS.openingHours.opens,
        closes: BUSINESS.openingHours.closes,
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Rituals',
      itemListElement: SERVICE_FACTS.map((service) => ({
        '@type': 'Offer',
        itemOffered: { '@id': serviceId(service.code) },
      })),
    },
    makesOffer: [
      { '@id': `${BUSINESS.url}/#offer-membership` },
      { '@id': `${BUSINESS.url}/#offer-gift-card` },
    ],
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BUSINESS.url}/preview#booking`,
        inLanguage: 'en-US',
        actionPlatform: [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform',
        ],
      },
      result: { '@type': 'Reservation', name: 'appointment' },
    },
  }

  if (BUSINESS.telephone) node.telephone = BUSINESS.telephone
  if (BUSINESS.geo) {
    node.geo = {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    }
  }
  if (BUSINESS.sameAs.length) node.sameAs = BUSINESS.sameAs

  return node
}

/** 站点级图谱：Organization + HealthAndBeautyBusiness + Service ×3 + Offer ×2 */
export const siteGraph = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@graph': [
    organizationNode(),
    businessNode(),
    ...serviceNodes(),
    ...offerNodes(),
  ],
})

export const faqGraph = (items: FaqItem[], locale: 'en' | 'zh'): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${BUSINESS.url}/#faq`,
  inLanguage: locale === 'zh' ? 'zh-CN' : 'en-US',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: locale === 'zh' ? item.questionZh : item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: locale === 'zh' ? item.answerZh : item.answer,
    },
  })),
})

export const breadcrumbGraph = (
  items: { name: string; path: string }[],
): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})

/** 直接拼成 <script type="application/ld+json"> 的内容 */
export const toJsonLdText = (data: JsonLd) => JSON.stringify(data)
