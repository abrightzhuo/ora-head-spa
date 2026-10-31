import { useEffect } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Footer } from '../components/FooterMobile'
import { Header } from '../components/Header'
import { siteHomePath } from '../lib/comingSoon'
import { useSiteStore, type Locale } from '../store/useSiteStore'

type Chapter = {
  eyebrow: string
  title: string
  body: string[]
  stats?: { value: string; label: string }[]
}

type AboutCopy = {
  hero: {
    eyebrow: string
    title: string
    subtitle: string
  }
  chapters: Chapter[]
  closing: {
    eyebrow: string
    title: string
    body: string
    cta: string
    imageAlt: string
  }
}

type ChapterMedia = {
  image: string
  alt: Record<string, string>
}

const chapterMedia: ChapterMedia[] = [
  {
    image: '/images/about/miao-village.jpg',
    alt: {
      en: 'Miao village nestled among forested mountains',
      zh: '群山环抱中的苗寨',
      'zh-TW': '群山環抱中的苗寨',
    },
  },
  {
    image: '/images/interior-02.jpg',
    alt: {
      en: 'Herbal ingredients displayed along the ORA corridor',
      zh: 'ORA 走廊中陈列的草本',
      'zh-TW': 'ORA 走廊中陳列的草本',
    },
  },
  {
    image: '/images/storefront.jpg',
    alt: {
      en: 'ORA Toucheer head spa storefront in Waltham',
      zh: '位于 Waltham 的 ORA Toucheer 门店',
      'zh-TW': '位於 Waltham 的 ORA Toucheer 門店',
    },
  },
  {
    image: '/images/interior-01.jpg',
    alt: {
      en: 'The ORA head spa treatment space in Waltham',
      zh: 'ORA 位于 Waltham 的头疗空间',
      'zh-TW': 'ORA 位於 Waltham 的頭療空間',
    },
  },
]

const english: AboutCopy = {
  hero: {
    eyebrow: 'ORA Toucheer · Waltham, Massachusetts',
    title: 'Our Story',
    subtitle:
      'A heritage of herbal care, carried from the mountains of Guizhou to Waltham — the story behind every ritual at ORA.',
  },
  chapters: [
    {
      eyebrow: 'Our Heritage',
      title: 'Rooted in Herbal Traditions',
      body: [
        'The inspiration for herbal hair care and body wellness comes from the rich herbal culture passed down through generations of the Miao people.',
        'For hundreds of years, herbal wisdom has been deeply woven into the daily lives of the Miao people, from their traditional use of mountain herbs and plants to their time-honored practices of caring for the hair, body, and mind. This enduring heritage has shaped a way of life that respects nature and values health, beauty, and overall well-being.',
      ],
    },
    {
      eyebrow: 'The Art of Herbal Care',
      title: 'Selected. Blended. Prepared.',
      body: [
        'We believe that everything in nature carries its own unique energy, deeply connected to our bodies and well-being. Through the gifts of nature, we find balance, restore our energy, and nurture a healthier way of life.',
        'Our herbal philosophy begins with carefully selected, high-quality botanicals, thoughtfully blended and prepared using time-honored traditional methods. Slowly simmered over gentle heat for dozens of hours, these precious herbs gradually release their natural essence, creating three signature herbal infusions that bring the wisdom and vitality of nature into every head spa experience.',
      ],
    },
    {
      eyebrow: 'Our Brand Journey',
      title: 'A Tradition That Continues',
      body: [
        'Established in 1998, TOUCHEER has grown and flourished over the decades, expanding to more than 10,000 locations across China and extending its presence internationally to countries including Singapore, the United States, Canada, Malaysia, and beyond. Through the wisdom of botanical wellness, TOUCHEER brings people around the world a more relaxed, balanced, and healthier way of life.',
        'Today, I am proud to bring this time-honored herbal care tradition to Waltham, Massachusetts, through ORA.',
      ],
      stats: [
        { value: '1998', label: 'Established' },
        { value: '10,000+', label: 'Locations' },
        { value: '5+', label: 'Countries' },
      ],
    },
    {
      eyebrow: 'The Head Spa Experience',
      title: 'A Moment Just for You',
      body: [
        'At ORA, you will experience a thoughtfully designed head spa journey featuring deep scalp cleansing, botanical care, a soothing warm herbal head bath, gentle head and neck relaxation, and nourishing hair rituals.',
        'Surrounded by calming aromas, comforting warmth, and a peaceful atmosphere, every moment is designed to help you unwind, release everyday stress, and enjoy a deeply relaxing experience that nurtures both body and mind.',
      ],
    },
  ],
  closing: {
    eyebrow: 'ORA Toucheer',
    title: 'More Than Hair Care',
    body: 'A personalized journey of relaxation and well-being. Waltham, Massachusetts.',
    cta: 'Book your ritual',
    imageAlt: 'ORA herbal head spa atmosphere',
  },
}

const simplifiedChinese: AboutCopy = {
  hero: {
    eyebrow: 'ORA Toucheer · 马萨诸塞州沃尔瑟姆',
    title: '我们的故事',
    subtitle:
      '一段源自苗寨的草本养护传承，从贵州的群山一路来到 Waltham——也是 ORA 每一次头疗背后的由来。',
  },
  chapters: [
    {
      eyebrow: '品牌渊源',
      title: '植根于草本传统',
      body: [
        'ORA 的草本头皮与身体养护灵感，来自苗族世代相传的草本文化。',
        '数百年间，草本智慧深深融入苗家人的日常——从采摘山间草木，到世代相传的护发、养身与安心之法。这份绵延至今的传统，塑造了一种尊重自然、重视健康、美丽与身心安顿的生活方式。',
      ],
    },
    {
      eyebrow: '草本之道',
      title: '甄选 · 调配 · 熬制',
      body: [
        '我们相信，自然万物都带着独特的能量，与我们的身体和状态紧密相连。借由自然的馈赠，我们找回平衡、恢复元气，也养出更健康的生活方式。',
        '我们的草本理念，从甄选优质植材开始，遵循古法调配与熬制：以文火慢煨数十小时，让草本缓缓释放精华，最终熬成三款招牌草本原汤，把自然的智慧与生命力带入每一次头疗体验。',
      ],
    },
    {
      eyebrow: '品牌历程',
      title: '一份延续至今的传承',
      body: [
        'TOUCHEER 创立于 1998 年，数十年间稳步成长，在中国发展出超过 10,000 家门店，并将脚步延伸至新加坡、美国、加拿大、马来西亚等地。以植物养护的智慧，TOUCHEER 为世界各地的人们带来更放松、更平衡、更健康的生活方式。',
        '今天，我很荣幸把这份传承已久的草本养护传统带到马萨诸塞州 Waltham，并以 ORA 之名与你相遇。',
      ],
      stats: [
        { value: '1998', label: '品牌创立' },
        { value: '10,000+', label: '全球门店' },
        { value: '5+', label: '国家与地区' },
      ],
    },
    {
      eyebrow: '头疗体验',
      title: '只属于你的一段时间',
      body: [
        '在 ORA，你将体验一套精心设计的头疗流程：深层头皮清洁、草本养护、温热草本头浴、头部与颈肩的轻柔放松，以及滋养发丝的护理仪式。',
        '在安抚的香气、恰到好处的温度与安静的氛围中，让每一刻都帮助你卸下日常的紧绷与压力，享受一场身心都被照顾到的深度放松。',
      ],
    },
  ],
  closing: {
    eyebrow: 'ORA Toucheer',
    title: '不止于护发',
    body: '一段关于放松与身心养护的专属旅程。马萨诸塞州 Waltham。',
    cta: '预约体验',
    imageAlt: 'ORA 草本头疗空间',
  },
}

const traditionalChinese: AboutCopy = {
  hero: {
    eyebrow: 'ORA Toucheer · 麻薩諸塞州沃爾瑟姆',
    title: '我們的故事',
    subtitle:
      '一段源自苗寨的草本養護傳承，從貴州的群山一路來到 Waltham——也是 ORA 每一次頭療背後的由來。',
  },
  chapters: [
    {
      eyebrow: '品牌淵源',
      title: '植根於草本傳統',
      body: [
        'ORA 的草本頭皮與身體養護靈感，來自苗族世代相傳的草本文化。',
        '數百年間，草本智慧深深融入苗家人的日常——從採摘山間草木，到世代相傳的護髮、養身與安心之法。這份綿延至今的傳統，塑造了一種尊重自然、重視健康、美麗與身心安頓的生活方式。',
      ],
    },
    {
      eyebrow: '草本之道',
      title: '甄選 · 調配 · 熬製',
      body: [
        '我們相信，自然萬物都帶著獨特的能量，與我們的身體和狀態緊密相連。藉由自然的饋贈，我們找回平衡、恢復元氣，也養出更健康的生活方式。',
        '我們的草本理念，從甄選優質植材開始，遵循古法調配與熬製：以文火慢煨數十小時，讓草本緩緩釋放精華，最終熬成三款招牌草本原湯，把自然的智慧與生命力帶入每一次頭療體驗。',
      ],
    },
    {
      eyebrow: '品牌歷程',
      title: '一份延續至今的傳承',
      body: [
        'TOUCHEER 創立於 1998 年，數十年間穩步成長，在中國發展出超過 10,000 家門店，並將腳步延伸至新加坡、美國、加拿大、馬來西亞等地。以植物養護的智慧，TOUCHEER 為世界各地的人們帶來更放鬆、更平衡、更健康的生活方式。',
        '今天，我很榮幸把這份傳承已久的草本養護傳統帶到麻薩諸塞州 Waltham，並以 ORA 之名與你相遇。',
      ],
      stats: [
        { value: '1998', label: '品牌創立' },
        { value: '10,000+', label: '全球門店' },
        { value: '5+', label: '國家與地區' },
      ],
    },
    {
      eyebrow: '頭療體驗',
      title: '只屬於你的一段時間',
      body: [
        '在 ORA，你將體驗一套精心設計的頭療流程：深層頭皮清潔、草本養護、溫熱草本頭浴、頭部與頸肩的輕柔放鬆，以及滋養髮絲的護理儀式。',
        '在安撫的香氣、恰到好處的溫度與安靜的氛圍中，讓每一刻都幫助你卸下日常的緊繃與壓力，享受一場身心都被照顧到的深度放鬆。',
      ],
    },
  ],
  closing: {
    eyebrow: 'ORA Toucheer',
    title: '不止於護髮',
    body: '一段關於放鬆與身心養護的專屬旅程。麻薩諸塞州 Waltham。',
    cta: '預約體驗',
    imageAlt: 'ORA 草本頭療空間',
  },
}

const spanish: AboutCopy = {
  hero: {
    eyebrow: 'ORA Toucheer · Waltham, Massachusetts',
    title: 'Nuestra historia',
    subtitle:
      'Una herencia de cuidado herbal que viaja desde las montañas de Guizhou hasta Waltham: la historia detrás de cada ritual en ORA.',
  },
  chapters: [
    {
      eyebrow: 'Nuestra herencia',
      title: 'Arraigados en la tradición herbal',
      body: [
        'La inspiración del cuidado herbal del cabello y del cuerpo proviene de la rica cultura herbolaria que el pueblo miao ha transmitido durante generaciones.',
        'Durante cientos de años, la sabiduría herbal ha formado parte de la vida cotidiana del pueblo miao: desde el uso tradicional de plantas y hierbas de montaña hasta sus prácticas ancestrales para cuidar el cabello, el cuerpo y la mente. Esta herencia ha dado forma a una manera de vivir que respeta la naturaleza y valora la salud, la belleza y el bienestar.',
      ],
    },
    {
      eyebrow: 'El arte del cuidado herbal',
      title: 'Seleccionar. Mezclar. Preparar.',
      body: [
        'Creemos que todo en la naturaleza tiene su propia energía, profundamente conectada con nuestro cuerpo y nuestro bienestar. A través de sus regalos encontramos equilibrio, recuperamos energía y cultivamos una vida más sana.',
        'Nuestra filosofía herbal comienza con ingredientes botánicos de alta calidad, seleccionados y mezclados con métodos tradicionales. Cocidos a fuego lento durante decenas de horas, las hierbas liberan su esencia y dan lugar a tres infusiones exclusivas que llevan la sabiduría y la vitalidad de la naturaleza a cada experiencia de spa capilar.',
      ],
    },
    {
      eyebrow: 'Nuestra trayectoria',
      title: 'Una tradición que continúa',
      body: [
        'Fundada en 1998, TOUCHEER ha crecido durante décadas hasta superar los 10.000 establecimientos en China y expandirse a Singapur, Estados Unidos, Canadá, Malasia y otros países. A través de la sabiduría del bienestar botánico, TOUCHEER acerca a personas de todo el mundo una vida más relajada, equilibrada y saludable.',
        'Hoy tengo el orgullo de traer esta tradición de cuidado herbal a Waltham, Massachusetts, a través de ORA.',
      ],
      stats: [
        { value: '1998', label: 'Fundación' },
        { value: '10.000+', label: 'Establecimientos' },
        { value: '5+', label: 'Países' },
      ],
    },
    {
      eyebrow: 'La experiencia del spa capilar',
      title: 'Un momento solo para ti',
      body: [
        'En ORA vivirás un recorrido de spa capilar diseñado con detalle: limpieza profunda del cuero cabelludo, cuidado botánico, un baño herbal tibio, relajación suave de cabeza y cuello y rituales nutritivos para el cabello.',
        'Rodeado de aromas calmantes, calidez reconfortante y una atmósfera serena, cada momento está pensado para ayudarte a soltar el estrés diario y disfrutar de una relajación profunda que cuida cuerpo y mente.',
      ],
    },
  ],
  closing: {
    eyebrow: 'ORA Toucheer',
    title: 'Más que cuidado del cabello',
    body: 'Un viaje personalizado de relajación y bienestar. Waltham, Massachusetts.',
    cta: 'Reserva tu ritual',
    imageAlt: 'Ambiente del spa capilar herbal de ORA',
  },
}

const french: AboutCopy = {
  hero: {
    eyebrow: 'ORA Toucheer · Waltham, Massachusetts',
    title: 'Notre histoire',
    subtitle:
      'Un héritage de soins végétaux, des montagnes du Guizhou jusqu’à Waltham — l’histoire derrière chaque rituel chez ORA.',
  },
  chapters: [
    {
      eyebrow: 'Notre héritage',
      title: 'Enracinés dans la tradition végétale',
      body: [
        'L’inspiration des soins végétaux pour les cheveux et le corps vient de la riche culture des plantes médicinales transmise de génération en génération par le peuple miao.',
        'Pendant des siècles, ce savoir a imprégné le quotidien du peuple miao : usage traditionnel des plantes de montagne, gestes ancestraux pour prendre soin des cheveux, du corps et de l’esprit. Cet héritage a façonné un art de vivre qui respecte la nature et valorise la santé, la beauté et le bien-être.',
      ],
    },
    {
      eyebrow: 'L’art du soin végétal',
      title: 'Sélectionner. Assembler. Préparer.',
      body: [
        'Nous croyons que chaque élément de la nature porte une énergie qui lui est propre, intimement liée à notre corps et à notre équilibre. Par ses bienfaits, nous retrouvons l’harmonie, l’énergie et un mode de vie plus sain.',
        'Notre philosophie commence par des plantes sélectionnées avec soin, assemblées puis préparées selon des méthodes traditionnelles. Mijotées à feu doux pendant des dizaines d’heures, elles libèrent leur essence et donnent trois infusions signature qui apportent la sagesse et la vitalité de la nature à chaque soin du cuir chevelu.',
      ],
    },
    {
      eyebrow: 'Notre parcours',
      title: 'Une tradition qui perdure',
      body: [
        'Fondée en 1998, TOUCHEER s’est développée au fil des décennies jusqu’à compter plus de 10 000 établissements en Chine, et s’est implantée à Singapour, aux États-Unis, au Canada, en Malaisie et ailleurs. Par la sagesse du bien-être végétal, TOUCHEER offre au monde une vie plus détendue, plus équilibrée et plus saine.',
        'C’est avec fierté que j’apporte aujourd’hui cette tradition de soin à Waltham, dans le Massachusetts, à travers ORA.',
      ],
      stats: [
        { value: '1998', label: 'Fondation' },
        { value: '10 000+', label: 'Établissements' },
        { value: '5+', label: 'Pays' },
      ],
    },
    {
      eyebrow: 'L’expérience du spa capillaire',
      title: 'Un moment rien que pour vous',
      body: [
        'Chez ORA, vous vivez un parcours de spa capillaire pensé dans le détail : nettoyage profond du cuir chevelu, soin végétal, bain de tête tiède aux plantes, détente douce de la tête et de la nuque, puis rituels nourrissants pour les cheveux.',
        'Dans une ambiance apaisante, portée par les arômes, la chaleur et le calme, chaque instant vous aide à relâcher le stress du quotidien et à profiter d’une détente profonde, pour le corps et l’esprit.',
      ],
    },
  ],
  closing: {
    eyebrow: 'ORA Toucheer',
    title: 'Plus qu’un soin capillaire',
    body: 'Un voyage personnalisé de détente et de bien-être. Waltham, Massachusetts.',
    cta: 'Réservez votre rituel',
    imageAlt: 'Ambiance du spa capillaire végétal ORA',
  },
}

const japanese: AboutCopy = {
  hero: {
    eyebrow: 'ORA Toucheer · マサチューセッツ州ウォルサム',
    title: '私たちのものがたり',
    subtitle:
      '貴州の山々からウォルサムへ受け継がれてきた植物ケアの物語。ORAのすべてのトリートメントの背景にある歴史です。',
  },
  chapters: [
    {
      eyebrow: 'ブランドの由来',
      title: '植物の伝統に根ざして',
      body: [
        'ORAのヘアケアとボディケアの着想は、ミャオ族が世代を超えて受け継いできた豊かな植物文化にあります。',
        '数百年のあいだ、山の草花を暮らしに取り入れ、髪と身体、そして心を整える知恵は、ミャオ族の日常に深く息づいてきました。この受け継がれてきた伝統が、自然を敬い、健康と美、そして穏やかな暮らしを大切にする生き方をかたちづくっています。',
      ],
    },
    {
      eyebrow: '植物ケアの技法',
      title: '選び、調合し、煎じる',
      body: [
        '自然のすべてには固有のエネルギーがあり、私たちの身体と心につながっている——そう考えています。自然の恵みを通じて、私たちはバランスを取り戻し、活力を養い、より健やかな暮らしを育みます。',
        '私たちの植物哲学は、厳選した上質な植物素材から始まります。伝統的な製法で丁寧に調合し、数十時間かけて弱火でじっくり煎じることで、植物はゆっくりとエッセンスを放ちます。こうして生まれる3種のシグネチャー煎じ液が、自然の知恵と生命力をすべてのヘッドスパ体験へと届けます。',
      ],
    },
    {
      eyebrow: 'ブランドの歩み',
      title: '受け継がれる伝統',
      body: [
        'TOUCHEERは1998年に設立され、数十年のあいだに中国で10,000店舗以上へと成長し、シンガポール、アメリカ、カナダ、マレーシアなど海外にも展開してきました。植物のウェルネスの知恵を通じて、世界の人々に、よりリラックスした、バランスのとれた健やかな暮らしを届けています。',
        'そして今日、この長く受け継がれてきた植物ケアの伝統を、ORAとしてマサチューセッツ州ウォルサムにお届けできることを誇りに思います。',
      ],
      stats: [
        { value: '1998', label: '設立' },
        { value: '10,000+', label: '店舗' },
        { value: '5+', label: '展開国・地域' },
      ],
    },
    {
      eyebrow: 'ヘッドスパ体験',
      title: 'あなただけのひととき',
      body: [
        'ORAでは、頭皮の深いクレンジング、植物のケア、温かなハーブのヘッドバス、頭部と首肩のやさしいリラクゼーション、そして髪を整えるトリートメントまで、丁寧に設計されたヘッドスパの流れをお楽しみいただけます。',
        '心安らぐ香り、心地よい温もり、静かな空間に包まれながら、日常の緊張と疲れをほどき、身体と心の両方をいたわる深いリラックスをお過ごしください。',
      ],
    },
  ],
  closing: {
    eyebrow: 'ORA Toucheer',
    title: '髪のケアを超えて',
    body: 'リラクゼーションとウェルネスの、あなただけの旅。マサチューセッツ州ウォルサム。',
    cta: 'トリートメントを予約',
    imageAlt: 'ORAのハーブヘッドスパ空間',
  },
}

const korean: AboutCopy = {
  hero: {
    eyebrow: 'ORA Toucheer · 매사추세츠 월섬',
    title: '우리의 이야기',
    subtitle:
      '구이저우의 산에서 월섬까지 이어져 온 허브 케어의 유산, ORA의 모든 리추얼 뒤에 있는 이야기입니다.',
  },
  chapters: [
    {
      eyebrow: '브랜드의 기원',
      title: '허브 전통에 뿌리를 두고',
      body: [
        'ORA의 두피·바디 케어는 먀오족이 대대로 물려온 풍부한 허브 문화에서 비롯되었습니다.',
        '수백 년 동안 산야의 약초를 활용하고 머리와 몸, 마음을 돌보는 지혜는 먀오족의 일상에 깊이 스며들어 왔습니다. 이 오랜 전통은 자연을 존중하고 건강과 아름다움, 그리고 편안한 삶을 소중히 여기는 방식을 만들어 왔습니다.',
      ],
    },
    {
      eyebrow: '허브 케어의 기술',
      title: '고르고, 배합하고, 달인다',
      body: [
        '자연의 모든 것은 고유한 에너지를 지니고 있으며 우리 몸과 마음에 깊이 연결되어 있다고 믿습니다. 자연의 선물을 통해 우리는 균형을 되찾고 활력을 회복하며 더 건강한 삶을 가꿉니다.',
        '저희의 허브 철학은 엄선한 고품질 식물 원료에서 시작됩니다. 전통 방식으로 정성껏 배합하고 수십 시간 동안 약한 불에 천천히 달여 허브가 지닌 본연의 정수를 끌어냅니다. 이렇게 완성된 세 가지 시그니처 허브 추출액이 자연의 지혜와 생기를 모든 헤드 스파 경험에 담아냅니다.',
      ],
    },
    {
      eyebrow: '브랜드 여정',
      title: '이어지는 전통',
      body: [
        'TOUCHEER는 1998년에 설립되어 수십 년간 성장하며 중국 내 10,000개 이상의 매장을 운영하고, 싱가포르·미국·캐나다·말레이시아 등 해외로 영역을 넓혀 왔습니다. 식물 웰니스의 지혜로 TOUCHEER는 전 세계 사람들에게 더 편안하고 균형 잡힌 건강한 삶을 전합니다.',
        '오늘 저는 이 오랜 허브 케어 전통을 ORA라는 이름으로 매사추세츠 월섬에 전하게 되어 자랑스럽게 생각합니다.',
      ],
      stats: [
        { value: '1998', label: '설립' },
        { value: '10,000+', label: '매장' },
        { value: '5+', label: '진출 국가' },
      ],
    },
    {
      eyebrow: '헤드 스파 경험',
      title: '오직 당신을 위한 시간',
      body: [
        'ORA에서는 두피 딥 클렌징, 보태니컬 케어, 따뜻한 허브 헤드 배스, 머리와 목·어깨의 부드러운 이완, 그리고 모발을 위한 영양 리추얼로 구성된 헤드 스파 여정을 경험하실 수 있습니다.',
        '편안한 향기와 따뜻한 온기, 고요한 분위기 속에서 일상의 긴장과 스트레스를 내려놓고 몸과 마음 모두를 돌보는 깊은 휴식을 누려 보세요.',
      ],
    },
  ],
  closing: {
    eyebrow: 'ORA Toucheer',
    title: '헤어 케어 그 이상',
    body: '휴식과 웰니스를 위한 나만의 여정. 매사추세츠 월섬.',
    cta: '리추얼 예약하기',
    imageAlt: 'ORA 허브 헤드 스파 공간',
  },
}

const german: AboutCopy = {
  hero: {
    eyebrow: 'ORA Toucheer · Waltham, Massachusetts',
    title: 'Unsere Geschichte',
    subtitle:
      'Ein Erbe der Kräuterpflege, von den Bergen Guizhous bis nach Waltham – die Geschichte hinter jedem Ritual bei ORA.',
  },
  chapters: [
    {
      eyebrow: 'Unsere Herkunft',
      title: 'Verwurzelt in Kräutertraditionen',
      body: [
        'Die Inspiration für pflanzliche Haar- und Körperpflege stammt aus der reichen Kräuterkultur, die das Miao-Volk über Generationen weitergegeben hat.',
        'Jahrhundertelang war das Kräuterwissen tief im Alltag der Miao verwurzelt – vom traditionellen Gebrauch von Bergkräutern bis zu den überlieferten Praktiken für Haar, Körper und Geist. Dieses Erbe hat eine Lebensweise geprägt, die die Natur respektiert und Gesundheit, Schönheit und Wohlbefinden wertschätzt.',
      ],
    },
    {
      eyebrow: 'Die Kunst der Kräuterpflege',
      title: 'Ausgewählt. Gemischt. Zubereitet.',
      body: [
        'Wir glauben, dass alles in der Natur eine eigene Energie trägt, die eng mit unserem Körper und unserem Wohlbefinden verbunden ist. Durch die Gaben der Natur finden wir Balance, tanken Kraft und pflegen einen gesünderen Lebensstil.',
        'Unsere Kräuterphilosophie beginnt mit sorgfältig ausgewählten, hochwertigen Pflanzen. Sie werden nach überlieferten Methoden gemischt und über viele Stunden bei sanfter Hitze langsam ausgekocht. So geben die Kräuter nach und nach ihre Essenz frei und es entstehen drei charakteristische Kräuterauszüge, die die Weisheit und Vitalität der Natur in jedes Kopfhaut-Erlebnis bringen.',
      ],
    },
    {
      eyebrow: 'Unser Weg',
      title: 'Eine Tradition, die weiterlebt',
      body: [
        '1998 gegründet, ist TOUCHEER über die Jahrzehnte auf mehr als 10.000 Standorte in China gewachsen und international in Singapur, den USA, Kanada, Malaysia und weiteren Ländern vertreten. Mit der Weisheit pflanzlichen Wohlbefindens schenkt TOUCHEER Menschen weltweit ein entspannteres, ausgeglicheneres und gesünderes Leben.',
        'Heute bin ich stolz, diese lange gepflegte Tradition der Kräuterpflege mit ORA nach Waltham, Massachusetts, zu bringen.',
      ],
      stats: [
        { value: '1998', label: 'Gegründet' },
        { value: '10.000+', label: 'Standorte' },
        { value: '5+', label: 'Länder' },
      ],
    },
    {
      eyebrow: 'Das Kopfhaut-Erlebnis',
      title: 'Ein Moment nur für Sie',
      body: [
        'Bei ORA erleben Sie eine durchdachte Kopfhaut-Reise: tiefe Reinigung der Kopfhaut, pflanzliche Pflege, ein wohltuendes warmes Kräuter-Kopfbad, sanfte Entspannung von Kopf, Nacken und Schultern sowie nährende Haarpflege-Rituale.',
        'Umgeben von beruhigenden Aromen, wohltuender Wärme und einer stillen Atmosphäre hilft Ihnen jeder Moment, Alltagsstress loszulassen und eine tiefe Entspannung zu genießen, die Körper und Geist nährt.',
      ],
    },
  ],
  closing: {
    eyebrow: 'ORA Toucheer',
    title: 'Mehr als Haarpflege',
    body: 'Eine persönliche Reise der Entspannung und des Wohlbefindens. Waltham, Massachusetts.',
    cta: 'Ritual buchen',
    imageAlt: 'Atmosphäre im ORA Kräuter-Kopfhautspa',
  },
}

const russian: AboutCopy = {
  hero: {
    eyebrow: 'ORA Toucheer · Уолтем, Массачусетс',
    title: 'Наша история',
    subtitle:
      'Наследие травяного ухода, которое прошло путь от гор Гуйчжоу до Уолтема — история, стоящая за каждым ритуалом ORA.',
  },
  chapters: [
    {
      eyebrow: 'Наше наследие',
      title: 'Корни — в травяных традициях',
      body: [
        'Вдохновение для травяного ухода за волосами и телом пришло из богатой травяной культуры, которую народ мяо передаёт из поколения в поколение.',
        'Сотни лет травяные знания были частью повседневной жизни мяо: от традиционного использования горных трав до передаваемых практик ухода за волосами, телом и разумом. Это наследие сформировало образ жизни, в котором уважают природу и ценят здоровье, красоту и благополучие.',
      ],
    },
    {
      eyebrow: 'Искусство травяного ухода',
      title: 'Отобрать. Смешать. Приготовить.',
      body: [
        'Мы верим, что всё в природе обладает собственной энергией, тесно связанной с нашим телом и самочувствием. Через дары природы мы находим баланс, восстанавливаем силы и выстраиваем более здоровый образ жизни.',
        'Наша травяная философия начинается с тщательно отобранных растений высокого качества, которые смешивают и готовят по традиционным методам. Долгие часы томления на медленном огне позволяют травам постепенно отдать свою суть — так рождаются три фирменных травяных настоя, приносящие мудрость и жизненную силу природы в каждый сеанс ухода за кожей головы.',
      ],
    },
    {
      eyebrow: 'Путь бренда',
      title: 'Традиция, которая продолжается',
      body: [
        'Основанная в 1998 году, TOUCHEER за десятилетия выросла до более чем 10 000 точек в Китае и вышла на международный уровень — Сингапур, США, Канада, Малайзия и другие страны. Через мудрость растительного благополучия TOUCHEER дарит людям по всему миру более спокойную, сбалансированную и здоровую жизнь.',
        'Сегодня я с гордостью привожу эту давнюю традицию травяного ухода в Уолтем, штат Массачусетс, вместе с ORA.',
      ],
      stats: [
        { value: '1998', label: 'Основано' },
        { value: '10 000+', label: 'Точек' },
        { value: '5+', label: 'Стран' },
      ],
    },
    {
      eyebrow: 'Опыт хед-спа',
      title: 'Момент только для вас',
      body: [
        'В ORA вас ждёт продуманный ритуал: глубокое очищение кожи головы, растительный уход, тёплая травяная ванна для головы, мягкое расслабление головы, шеи и плеч, а также питательные ритуалы для волос.',
        'В окружении успокаивающих ароматов, тепла и тихой атмосферы каждый момент помогает отпустить повседневное напряжение и подарить себе глубокое расслабление, которое заботится и о теле, и о разуме.',
      ],
    },
  ],
  closing: {
    eyebrow: 'ORA Toucheer',
    title: 'Больше, чем уход за волосами',
    body: 'Персональный путь расслабления и благополучия. Уолтем, штат Массачусетс.',
    cta: 'Записаться на ритуал',
    imageAlt: 'Атмосфера травяного хед-спа ORA',
  },
}

const aboutCopy: Record<Locale, AboutCopy> = {
  en: english,
  zh: simplifiedChinese,
  'zh-TW': traditionalChinese,
  es: spanish,
  fr: french,
  ja: japanese,
  ko: korean,
  de: german,
  ru: russian,
}

export default function AboutPage() {
  const locale = useSiteStore((state) => state.locale)
  const t = aboutCopy[locale]
  const bookHref = `${siteHomePath()}?lang=${locale}#booking`

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible')
        })
      },
      { threshold: 0.12 },
    )
    document
      .querySelectorAll('.observe-reveal:not(.is-visible)')
      .forEach((element) => revealObserver.observe(element))
    return () => revealObserver.disconnect()
    // Re-run on locale change so freshly rendered copy is observed again.
  }, [locale])

  return (
    <main className="about-page">
      <Header actionHref={bookHref} returnToHome />

      <section className="about-page__hero">
        <img src="/images/about/story-hero.jpg" alt="" />
        <div className="about-page__hero-inner">
          <p className="eyebrow eyebrow--light">{t.hero.eyebrow}</p>
          <h1>{t.hero.title}</h1>
          <p className="about-page__lede">{t.hero.subtitle}</p>
        </div>
      </section>

      <div className="about-story section-shell">
        {t.chapters.map((chapter, index) => {
          const media = chapterMedia[index]
          const alt = media?.alt[locale] ?? media?.alt.en
          return (
            <article
              className={`about-chapter ${index % 2 === 1 ? 'is-reversed' : ''}`}
              key={index}
            >
              <figure className="about-chapter__media observe-reveal">
                <img src={media?.image} alt={alt ?? ''} loading="lazy" />
              </figure>
              <div className="about-chapter__body observe-reveal">
                <span className="about-chapter__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="eyebrow">{chapter.eyebrow}</p>
                <h2>{chapter.title}</h2>
                {chapter.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {chapter.stats && (
                  <div className="about-chapter__stats">
                    {chapter.stats.map((stat) => (
                      <div key={stat.label}>
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <section className="about-closing">
        <div className="about-closing__inner observe-reveal">
          <p className="eyebrow eyebrow--light">{t.closing.eyebrow}</p>
          <h2>{t.closing.title}</h2>
          <p>{t.closing.body}</p>
          <a className="about-closing__cta" href={bookHref}>
            {t.closing.cta}
            <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="about-closing__visual">
          <img
            src="/images/about/miao-portrait.jpg"
            alt={t.closing.imageAlt}
            loading="lazy"
          />
        </div>
      </section>

      <Footer />
    </main>
  )
}
