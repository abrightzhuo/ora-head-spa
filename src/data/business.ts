/**
 * 商家事实的唯一来源（GEO / 结构化数据 / llms.txt 都从这里取值）。
 *
 * 价格与时长取自线上 services 目录（Supabase `services` 表）：
 *   pure-reset     Pure Reset      60 min   $179.00
 *   vital-glow     Vital Glow      75 min   $169.00
 *   deep-stillness Deep Stillness  90 min   $188.99
 * 改动价格时请同时更新这里与后台服务目录，避免结构化数据和实际售卖不一致。
 *
 * ⚠️ 待补充字段（需要线下确认，为空时结构化数据会自动省略，不会输出错误信息）：
 *   address.streetAddress、address.postalCode、geo、telephone、sameAs、priceRange 可保留
 */

export type ServiceFact = {
  code: string
  name: string
  nameZh: string
  nameZhTw: string
  durationMinutes: number
  /** 以美元计，保留两位小数 */
  price: number
  /** 可被 AI 直接摘引的首段：时长 + 动作 + 人群 + 价格 + 适用场景 */
  summary: string
  summaryZh: string
  summaryZhTw: string
  description: string
  descriptionZh: string
}

export const SERVICE_FACTS: ServiceFact[] = [
  {
    code: 'pure-reset',
    name: 'Pure Reset',
    nameZh: '净澈舒缓',
    nameZhTw: '淨澈舒緩',
    durationMinutes: 60,
    price: 179,
    summary:
      'In 60 minutes, our Pure Reset ritual cleanses oil and styling residue, rebalances the scalp and releases tightness for guests with congested roots, priced at $179. Best for oily scalps, product build-up and anyone who wants a lighter, cleaner scalp.',
    summaryZh:
      '60 分钟的净澈舒缓，针对油脂与造型残留做深层清洁，平衡头皮状态并松开紧绷感，价格 $179。适合油性头皮、造型产品堆积，或想找回清爽轻盈感的人。',
    summaryZhTw:
      '60 分鐘的淨澈舒緩，針對油脂與造型殘留做深層清潔，平衡頭皮狀態並鬆開緊繃感，價格 $179。適合油性頭皮、造型產品堆積，或想找回清爽輕盈感的人。',
    description:
      'A refreshing ritual for scalps prone to oil and product build-up.',
    descriptionZh: '为容易积聚油脂与造型残留的头皮设计，带来洁净、轻盈的舒适感。',
  },
  {
    code: 'vital-glow',
    name: 'Vital Glow',
    nameZh: '元气焕活',
    nameZhTw: '元氣煥活',
    durationMinutes: 75,
    price: 169,
    summary:
      'In 75 minutes, our Vital Glow ritual deep-cleanses, feeds the scalp with botanical care and smooths the hair for guests who want softness and shine, priced at $169. Best for dry, dull or weighed-down hair that needs nourishment.',
    summaryZh:
      '75 分钟的元气焕活，先温和清洁，再用草本养护滋养头皮、柔顺发丝，价格 $169。适合干燥、暗哑或扁塌无力、需要滋养的发况。',
    summaryZhTw:
      '75 分鐘的元氣煥活，先溫和清潔，再用草本養護滋養頭皮、柔順髮絲，價格 $169。適合乾燥、暗啞或扁塌無力、需要滋養的髮況。',
    description:
      'Cleansing and nourishing care for soft, weightless and glossy hair.',
    descriptionZh: '细致清洁与丰润养护相结合，让发丝触感更柔顺，状态更显蓬松有光泽。',
  },
  {
    code: 'deep-stillness',
    name: 'Deep Stillness',
    nameZh: '深度静享',
    nameZhTw: '深度靜享',
    durationMinutes: 90,
    price: 188.99,
    summary:
      'In 90 minutes, our Deep Stillness ritual extends cleansing and slow massage from scalp to neck and shoulders for guests who need to decompress, priced at $188.99. Best for screen fatigue, shoulder tension and a full reset.',
    summaryZh:
      '90 分钟的深度静享，把清洁与舒缓手法从头部延伸到肩颈，价格 $188.99。适合长时间面对屏幕、肩颈紧绷，或想要一次彻底放松的人。',
    summaryZhTw:
      '90 分鐘的深度靜享，把清潔與舒緩手法從頭部延伸到肩頸，價格 $188.99。適合長時間面對螢幕、肩頸緊繃，或想要一次徹底放鬆的人。',
    description:
      'An extended head, neck and shoulder ritual for deep relaxation.',
    descriptionZh: '拉长放松的节奏，从头部延伸至肩颈，在安静的触感中卸下一日疲惫。',
  },
]

export type BrandFact = { value: string; label: string; labelZh: string }

export const BRAND_FACTS: BrandFact[] = [
  { value: '1998', label: 'TOUCHEER founded', labelZh: 'TOUCHEER 创立' },
  { value: '10,000+', label: 'locations worldwide', labelZh: '全球门店' },
  { value: '5+', label: 'countries and regions', labelZh: '国家与地区' },
  { value: '60–90 min', label: 'per ritual', labelZh: '单次护理时长' },
  { value: '1:1', label: 'therapist to guest', labelZh: '一对一服务' },
]

export const BUSINESS = {
  brandName: 'ORA',
  /** 站内全称，与 Google Business Profile / Yelp 保持一致 */
  legalName: 'ORA Head Spa & Wellness',
  alternateNames: ['ORA Toucheer', 'ORA Head Spa'],
  parentBrand: 'TOUCHEER',
  url: 'https://www.myoraspa.com',
  description:
    'ORA is a herbal head spa in Waltham, Massachusetts. Botanical scalp and skin rituals of 60 to 90 minutes, one-to-one care and a quiet space to unwind.',
  foundingYear: 1998,
  priceRange: '$$',
  telephone: '',
  address: {
    streetAddress: '',
    addressLocality: 'Waltham',
    addressRegion: 'MA',
    postalCode: '',
    addressCountry: 'US',
  },
  geo: null as { latitude: number; longitude: number } | null,
  openingHours: {
    days: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    opens: '10:00',
    closes: '21:00',
  },
  sameAs: [] as string[],
  images: [
    '/images/about/story-hero.jpg',
    '/images/interior-01.jpg',
    '/images/interior-02.jpg',
  ],
  logo: '/images/logo.jpg',
  membership: {
    name: 'ORA Annual Membership',
    price: 288,
    url: '/membership',
    description:
      'Annual membership with 10% off every ritual, one complimentary ritual and 20% off retail products.',
  },
  giftCard: {
    name: 'ORA Gift Card',
    minPrice: 25,
    maxPrice: 1000,
    url: '/gift-cards',
    description:
      'Gift card for any ORA ritual, redeemable in store in Waltham, Massachusetts.',
  },
}

export const absoluteUrl = (path: string) =>
  new URL(path, BUSINESS.url).toString()

export const hasPostalAddress = () =>
  Boolean(BUSINESS.address.streetAddress && BUSINESS.address.postalCode)
