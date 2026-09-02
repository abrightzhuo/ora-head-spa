import { baseCopy, type Copy } from './content'
import type { Locale } from './store/useSiteStore'

type LocalePack = {
  nav: string[]
  book: string
  hero: [string, string, string, string]
  philosophy: [string, string, ...string[]]
  services: [string, string, string, string, string, string, string, string, string]
  ritual: [string, ...string[]]
  space: [string, string, string, string]
  about: [string, string, string, string, string]
  testimonial: [string, string, string, string, string, string, string]
  booking: string[]
  mobile: string[]
}

const serviceDurations = ['60', '75', '90']

type LocalizedMeta = {
  heroEyebrow: string
  heroNote: string
  philosophyEyebrow: string
  servicesEyebrow: string
  ritualEyebrow: string
  spaceEyebrow: string
  aboutEyebrow: string
  aboutQuote: string
  testimonialEyebrow: string
  bookingEyebrow: string
  footerStatement: string
  footerRights: string
  serviceHighlights: string[][]
}

const localizedMeta: Record<
  Exclude<Locale, 'zh' | 'zh-TW' | 'en'>,
  LocalizedMeta
> = {
  es: {
    heroEyebrow: 'BIENESTAR HERBAL PARA CUERO CABELLUDO Y PIEL',
    heroNote: 'NUTRIR · RESTAURAR · RENOVAR',
    philosophyEyebrow: 'NUESTRA FILOSOFÍA',
    servicesEyebrow: 'RITUALES DISTINTIVOS',
    ritualEyebrow: 'EL RITUAL ORA',
    spaceEyebrow: 'NUESTRO ESPACIO',
    aboutEyebrow: 'SOBRE ORA',
    aboutQuote: 'Nutre las raíces. Restaura el ritmo. Renuévate desde dentro.',
    testimonialEyebrow: 'NOTAS DE CLIENTES',
    bookingEyebrow: 'RESERVA TU RITUAL',
    footerStatement: 'Nutrir · Restaurar · Renovar',
    footerRights: '© 2026 ORA Bienestar herbal para cuero cabelludo y piel',
    serviceHighlights: [
      ['Observación del cuero cabelludo', 'Limpieza herbal', 'Masaje relajante'],
      ['Limpieza suave', 'Cuidado nutritivo', 'Relajación de cuello y hombros'],
      ['Respiración aromática', 'Técnicas profundas', 'Compresa caliente y reposo'],
    ],
  },
  fr: {
    heroEyebrow: 'BIEN-ÊTRE VÉGÉTAL DU CUIR CHEVELU ET DE LA PEAU',
    heroNote: 'NOURRIR · RESTAURER · RENOUVELER',
    philosophyEyebrow: 'NOTRE PHILOSOPHIE',
    servicesEyebrow: 'RITUELS SIGNATURE',
    ritualEyebrow: 'LE RITUEL ORA',
    spaceEyebrow: 'NOTRE ESPACE',
    aboutEyebrow: 'À PROPOS D’ORA',
    aboutQuote: 'Nourrir les racines. Restaurer le rythme. Se renouveler de l’intérieur.',
    testimonialEyebrow: 'MOTS DE NOS CLIENTES',
    bookingEyebrow: 'RÉSERVEZ VOTRE RITUEL',
    footerStatement: 'Nourrir · Restaurer · Renouveler',
    footerRights: '© 2026 ORA Bien-être végétal du cuir chevelu et de la peau',
    serviceHighlights: [
      ['Observation du cuir chevelu', 'Nettoyage végétal', 'Massage apaisant'],
      ['Nettoyage doux', 'Soin nourrissant', 'Détente de la nuque et des épaules'],
      ['Respiration aromatique', 'Gestes profonds', 'Compresse chaude et repos'],
    ],
  },
  ja: {
    heroEyebrow: '植物の恵みによる頭皮と肌のウェルネス',
    heroNote: '養う · 整える · 生まれ変わる',
    philosophyEyebrow: '私たちの理念',
    servicesEyebrow: 'シグネチャーケア',
    ritualEyebrow: 'ORAのケアリチュアル',
    spaceEyebrow: '私たちの空間',
    aboutEyebrow: 'ORAについて',
    aboutQuote: '根元を養い、リズムを整え、内側から生まれ変わる。',
    testimonialEyebrow: 'お客様の声',
    bookingEyebrow: 'ケアを予約する',
    footerStatement: '養う · 整える · 生まれ変わる',
    footerRights: '© 2026 ORA 植物の恵みによる頭皮と肌のウェルネス',
    serviceHighlights: [
      ['頭皮チェック', '植物由来の洗浄', 'リラックスマッサージ'],
      ['やさしい洗浄', 'うるおいケア', '首・肩のリラックス'],
      ['アロマ呼吸', '深い手技', '温熱ケアと休息'],
    ],
  },
  ko: {
    heroEyebrow: '허브 두피와 피부 웰니스',
    heroNote: '영양 · 회복 · 재생',
    philosophyEyebrow: '우리의 철학',
    servicesEyebrow: '시그니처 케어',
    ritualEyebrow: 'ORA 케어 리추얼',
    spaceEyebrow: '우리의 공간',
    aboutEyebrow: 'ORA 소개',
    aboutQuote: '뿌리를 채우고, 리듬을 회복하며, 내면부터 새로워집니다.',
    testimonialEyebrow: '고객 이야기',
    bookingEyebrow: '케어 예약',
    footerStatement: '영양 · 회복 · 재생',
    footerRights: '© 2026 ORA 허브 두피와 피부 웰니스',
    serviceHighlights: [
      ['두피 상태 확인', '허브 클렌징', '진정 마사지'],
      ['순한 클렌징', '영양 케어', '목과 어깨 이완'],
      ['아로마 호흡', '깊은 테크닉', '온열 케어와 휴식'],
    ],
  },
  de: {
    heroEyebrow: 'PFLANZLICHE KOPFHAUT- UND HAUTPFLEGE',
    heroNote: 'NÄHREN · REGENERIEREN · ERNEUERN',
    philosophyEyebrow: 'UNSERE PHILOSOPHIE',
    servicesEyebrow: 'SIGNATURE-RITUALE',
    ritualEyebrow: 'DAS ORA-RITUAL',
    spaceEyebrow: 'UNSER RAUM',
    aboutEyebrow: 'ÜBER ORA',
    aboutQuote: 'Die Wurzeln nähren. Den Rhythmus regenerieren. Von innen erneuern.',
    testimonialEyebrow: 'STIMMEN UNSERER GÄSTE',
    bookingEyebrow: 'RITUAL RESERVIEREN',
    footerStatement: 'Nähren · Regenerieren · Erneuern',
    footerRights: '© 2026 ORA Pflanzliche Kopfhaut- und Hautpflege',
    serviceHighlights: [
      ['Kopfhautanalyse', 'Pflanzliche Reinigung', 'Entspannende Massage'],
      ['Sanfte Reinigung', 'Nährende Pflege', 'Nacken- und Schulterentspannung'],
      ['Aromatische Atmung', 'Tiefenwirksame Techniken', 'Warme Kompresse und Ruhe'],
    ],
  },
  ru: {
    heroEyebrow: 'РАСТИТЕЛЬНЫЙ УХОД ЗА КОЖЕЙ ГОЛОВЫ И ЛИЦА',
    heroNote: 'ПИТАНИЕ · ВОССТАНОВЛЕНИЕ · ОБНОВЛЕНИЕ',
    philosophyEyebrow: 'НАША ФИЛОСОФИЯ',
    servicesEyebrow: 'ФИРМЕННЫЕ РИТУАЛЫ',
    ritualEyebrow: 'РИТУАЛ ORA',
    spaceEyebrow: 'НАШЕ ПРОСТРАНСТВО',
    aboutEyebrow: 'ОБ ORA',
    aboutQuote: 'Питать корни. Восстанавливать ритм. Обновляться изнутри.',
    testimonialEyebrow: 'ОТЗЫВЫ ГОСТЕЙ',
    bookingEyebrow: 'ЗАБРОНИРОВАТЬ РИТУАЛ',
    footerStatement: 'Питание · Восстановление · Обновление',
    footerRights: '© 2026 ORA Растительный уход за кожей головы и лица',
    serviceHighlights: [
      ['Диагностика кожи головы', 'Растительное очищение', 'Расслабляющий массаж'],
      ['Мягкое очищение', 'Питательный уход', 'Расслабление шеи и плеч'],
      ['Ароматическое дыхание', 'Глубокие техники', 'Тёплый компресс и отдых'],
    ],
  },
}

function makeCopy(
  locale: Exclude<Locale, 'zh' | 'zh-TW' | 'en'>,
  pack: LocalePack,
  minute: string,
): Copy {
  const en = baseCopy.en
  const meta = localizedMeta[locale]
  const serviceTitles = [pack.services[2], pack.services[4], pack.services[6]]
  const serviceDescriptions = [pack.services[3], pack.services[5], pack.services[7]]

  return {
    nav: pack.nav.map((label, index) => ({ label, href: en.nav[index].href })),
    book: pack.book,
    hero: {
      ...en.hero,
      eyebrow: meta.heroEyebrow,
      title: pack.hero[0],
      italic: pack.hero[1],
      description: pack.hero[2],
      explore: pack.hero[3],
      note: meta.heroNote,
    },
    philosophy: {
      ...en.philosophy,
      eyebrow: meta.philosophyEyebrow,
      title: pack.philosophy[0],
      body: pack.philosophy[1],
      values: en.philosophy.values.map((value, index) => ({
        ...value,
        title: pack.philosophy[2 + index * 2],
        text: pack.philosophy[3 + index * 2],
      })),
    },
    services: {
      ...en.services,
      eyebrow: meta.servicesEyebrow,
      title: pack.services[0],
      intro: pack.services[1],
      items: en.services.items.map((item, index) => ({
        ...item,
        title: serviceTitles[index],
        english: '',
        duration: `${serviceDurations[index]} ${minute}`,
        description: serviceDescriptions[index],
        highlights: meta.serviceHighlights[index],
      })),
      choose: pack.services[8] ?? en.services.choose,
    },
    ritual: {
      ...en.ritual,
      eyebrow: meta.ritualEyebrow,
      title: pack.ritual[0],
      steps: en.ritual.steps.map((step, index) => ({
        ...step,
        title: pack.ritual[1 + index * 2],
        text: pack.ritual[2 + index * 2],
      })),
    },
    space: {
      ...en.space,
      eyebrow: meta.spaceEyebrow,
      title: pack.space[0],
      body: pack.space[1],
      hall: pack.space[2],
      lounge: pack.space[3],
    },
    about: {
      ...en.about,
      eyebrow: meta.aboutEyebrow,
      title: pack.about[0],
      body: pack.about[1],
      quote: meta.aboutQuote,
      stats: en.about.stats.map((stat, index) => ({ ...stat, label: pack.about[2 + index] })),
    },
    testimonial: {
      ...en.testimonial,
      eyebrow: meta.testimonialEyebrow,
      title: pack.testimonial[0],
      quotes: en.testimonial.quotes.map((quote, index) => ({
        ...quote,
        text: pack.testimonial[1 + index * 2],
        detail: pack.testimonial[2 + index * 2],
      })),
    },
    booking: {
      ...en.booking,
      eyebrow: meta.bookingEyebrow,
      title: pack.booking[0],
      body: pack.booking[1],
      name: pack.booking[2],
      phone: pack.booking[3],
      service: pack.booking[4],
      date: pack.booking[5],
      message: pack.booking[6],
      optional: pack.booking[7],
      submit: pack.booking[8],
      success: pack.booking[9],
      required: pack.booking[10],
      phoneError: pack.booking[11],
      contact: pack.booking[12],
      contactValue: pack.booking[13],
      hours: pack.booking[14],
      address: pack.booking[15],
      hoursValue: pack.booking[16],
    },
    footer: {
      statement: meta.footerStatement,
      rights: meta.footerRights,
    },
    mobile: {
      home: pack.mobile[0],
      care: pack.mobile[1],
      space: pack.mobile[2],
      booking: pack.mobile[3],
    },
  }
}

const packs: Record<Exclude<Locale, 'zh' | 'zh-TW' | 'en'>, { minute: string; data: LocalePack }> = {
  es: {
    minute: 'min',
    data: {
      nav: ['Filosofía', 'Rituales', 'Nuestro espacio', 'Sobre ORA'],
      book: 'Reservar',
      hero: ['Deja respirar el cuero cabelludo', 'Deja que cuerpo y mente bajen el ritmo', 'Cuidado herbal, técnicas profesionales y un espacio tranquilo para regalarte un momento verdaderamente tuyo.', 'Descubrir los rituales'],
      philosophy: ['El equilibrio natural comienza en la raíz', 'El cuidado del cuero cabelludo es más que limpieza: un ritual de tacto, respiración y ritmo que libera la tensión.', 'Pureza herbal', 'Extractos vegetales suaves que respetan tu ritmo natural.', 'Ritual personalizado', 'Escuchamos y observamos lo que necesitas hoy.', 'Relajación profunda', 'Gestos precisos para cabeza, cuello y hombros.', 'Cuidado continuo', 'Una experiencia que se convierte en bienestar duradero.'],
      services: ['Tres ritmos, una misma calma', 'Cada ritual comienza con una conversación tranquila. Elige la sensación que necesitas hoy.', 'Pureza y calma', 'Limpieza ligera para cuero cabelludo con grasa o residuos.', 'Renovación vital', 'Limpieza y nutrición para un cabello suave, ligero y brillante.', 'Quietud profunda', 'Relajación prolongada desde la cabeza hasta los hombros.', 'Elegir este ritual'],
      ritual: ['Un ritual para los cinco sentidos', 'Consulta tranquila', 'Conocemos tus hábitos y cómo te sientes.', 'Observación', 'Examinamos el cuero cabelludo y el cabello.', 'Limpieza herbal', 'Una limpieza suave y refrescante.', 'Técnicas relajantes', 'Relajación de cabeza, cuello y hombros.', 'Reposo renovador', 'Vuelve a ti entre calidez y aromas.'],
      space: ['Cuando cae la luz, el tiempo se ralentiza', 'Madera clara, piedra cálida y luz sutil convierten el espacio en parte del ritual.', 'Galería de luz', 'Zona de tratamientos'],
      about: ['Inspirados por la naturaleza, guiados por la experiencia', 'ORA combina inspiración botánica, técnicas precisas y calma contemporánea, adaptando cada ritual a tu propio ritmo.', 'Atención personal', 'Etapas inmersivas', 'Minutos de calma'],
      testimonial: ['Aquí vuelven a escucharse', 'Todo se ralentizó al entrar. Cada gesto fue suave y preciso.', 'Quietud profunda · Tercera visita', 'El silencio era perfecto; mi cuero cabelludo quedó fresco y el cabello suave.', 'Pureza y calma · Primera visita', 'Adaptaron el ritmo a mi estado. Me sentí realmente cuidada.', 'Renovación vital · Miembro ORA'],
      booking: ['Regálate un momento de calma', 'Comparte tus preferencias y confirmaremos horario y ritual.', 'Tu nombre', 'Teléfono', 'Ritual deseado', 'Fecha deseada', '¿Algo que quieras contarnos?', 'Opcional', 'Solicitar reserva', 'Hemos recibido tu solicitud. Te contactaremos pronto.', 'Completa los campos obligatorios', 'Introduce un teléfono válido', 'Reservas', 'Tu asesor te contactará tras enviar el formulario', 'Horario', 'Dirección', 'Lunes a domingo, 10:00–21:00'],
      mobile: ['Inicio', 'Rituales', 'Espacio', 'Reservar'],
    },
  },
  fr: {
    minute: 'min',
    data: {
      nav: ['Philosophie', 'Rituels', 'Notre espace', 'À propos'],
      book: 'Réserver',
      hero: ['Laissez respirer votre cuir chevelu', 'Laissez le corps et l’esprit ralentir', 'Des soins botaniques, des gestes professionnels et un espace paisible pour un moment qui vous appartient.', 'Découvrir les rituels'],
      philosophy: ['L’équilibre naturel commence à la racine', 'Le soin du cuir chevelu va au-delà du nettoyage : un rituel de toucher, de respiration et de rythme.', 'Pureté botanique', 'Des extraits doux qui respectent votre rythme naturel.', 'Rituel personnalisé', 'Nous écoutons vos besoins du moment.', 'Détente profonde', 'Des gestes précis pour la tête, la nuque et les épaules.', 'Soin durable', 'Une expérience qui devient un art de vivre.'],
      services: ['Trois rythmes, une même détente', 'Chaque rituel commence par un échange en douceur. Choisissez la sensation dont vous avez besoin.', 'Pureté apaisante', 'Un nettoyage léger pour éliminer sébum et résidus.', 'Éclat revitalisant', 'Nettoyage et nutrition pour des cheveux doux et brillants.', 'Quiétude profonde', 'Une relaxation prolongée de la tête aux épaules.', 'Choisir ce rituel'],
      ritual: ['Un rituel pour les cinq sens', 'Échange en douceur', 'Nous découvrons vos habitudes et votre ressenti.', 'Observation', 'Nous examinons le cuir chevelu et les cheveux.', 'Nettoyage botanique', 'Un nettoyage doux et rafraîchissant.', 'Gestes apaisants', 'Détente de la tête à la nuque et aux épaules.', 'Repos régénérant', 'Revenez à vous dans la chaleur et les parfums.'],
      space: ['Quand la lumière se pose, le temps ralentit', 'Bois clair, pierre chaleureuse et lumière subtile font de l’espace une partie du rituel.', 'Galerie de lumière', 'Espace de soins'],
      about: ['Inspirés par la nature, guidés par le savoir-faire', 'ORA unit inspiration végétale, gestes précis et calme contemporain pour suivre votre rythme.', 'Attention personnelle', 'Étapes immersives', 'Minutes de sérénité'],
      testimonial: ['Ici, elles retrouvent leur voix intérieure', 'Tout a ralenti dès mon arrivée. Chaque geste était doux et précis.', 'Quiétude profonde · Troisième visite', 'Le silence était parfait, mon cuir chevelu frais et mes cheveux doux.', 'Pureté apaisante · Première visite', 'Le rythme s’est adapté à mon état. Je me suis sentie vraiment écoutée.', 'Éclat revitalisant · Membre ORA'],
      booking: ['Accordez-vous un moment de calme', 'Partagez vos préférences, nous confirmerons l’horaire et le rituel.', 'Votre nom', 'Téléphone', 'Rituel souhaité', 'Date souhaitée', 'Un détail à nous confier ?', 'Facultatif', 'Demander une réservation', 'Demande reçue. Nous vous contacterons rapidement.', 'Remplissez les champs obligatoires', 'Saisissez un numéro valide', 'Réservations', 'Votre conseiller vous contactera après l’envoi', 'Horaires', 'Adresse', 'Du lundi au dimanche, 10 h–21 h'],
      mobile: ['Accueil', 'Rituels', 'Espace', 'Réserver'],
    },
  },
  ja: {
    minute: '分',
    data: {
      nav: ['ケア理念', 'トリートメント', '癒やしの空間', 'ORAについて'],
      book: '体験を予約',
      hero: ['頭皮から、深呼吸', '心と体を、ゆるやかに', '植物の恵み、確かな手技、静かな空間。自分自身に還るひとときを。', 'トリートメントを見る'],
      philosophy: ['頭皮から、自然なバランスを', 'スカルプケアは洗浄だけではありません。触れる感覚、呼吸、リズムを大切にする静かな儀式です。', '植物の力で浄化', '穏やかな植物由来成分で本来のリズムを尊重します。', '一人ひとりに合わせて', 'その日の状態に合うケアをご提案します。', '深いリラクゼーション', '頭部から首、肩の緊張を和らげます。', '続いていく健やかさ', '心地よさが続く習慣へつなげます。'],
      services: ['3つのリズム、ひとつの安らぎ', 'やさしいカウンセリングから始め、今求める感覚をお選びください。', 'ピュアリセット', '皮脂や残留物を穏やかに洗い流し、軽やかに。', 'バイタルグロウ', '洗浄とうるおいケアで、やわらかな艶髪へ。', 'ディープスティルネス', '頭部から肩まで、ゆったり深く解きほぐします。', 'このコースを選ぶ'],
      ritual: ['五感を満たす、ひとつの儀式', 'カウンセリング', '習慣と今日の状態を伺います。', '頭皮チェック', '頭皮と髪を丁寧に確認します。', '植物の力で浄化', '穏やかに洗い上げます。', '心地よい手技', '頭部から肩へ深くリラックス。', '静かな休息', 'ぬくもりと香りに包まれます。'],
      space: ['光が降り注ぎ、時がゆるむ', 'やわらかな木、温かな石、抑えた光。空間そのものがケアの一部です。', '光と影の回廊', '静寂のケア空間'],
      about: ['自然に学び、専門性を大切に', '植物の着想、丁寧な手技、現代的な静けさを、一人ひとりのリズムに合わせます。', '一人ひとりに', '段階の没入体験', '分間の穏やかな時間'],
      testimonial: ['ここで、もう一度自分の声を聴く', '扉を入った瞬間から、時間がゆっくり流れ始めました。', 'ディープスティルネス · 3回目', '心地よい静けさ。頭皮はすっきり、髪もなめらかに。', 'ピュアリセット · 初回', '私の状態に合わせたペースで、大切に向き合ってもらえました。', 'バイタルグロウ · ORAメンバー'],
      booking: ['自分のために、静かな時間を', 'ご希望を伺い、日時とおすすめのケアをご案内します。', 'お名前', '電話番号', 'ご希望のコース', 'ご希望日', 'ご要望・ご相談', '任意', '予約を申し込む', 'ご希望を承りました。近日中にご連絡します。', '必須項目を入力してください', '有効な電話番号を入力してください', 'ご予約', '送信後、担当者よりご連絡します', '営業時間', '店舗所在地', '月曜日〜日曜日 10:00–21:00'],
      mobile: ['ホーム', 'ケア', '空間', '予約'],
    },
  },
  ko: {
    minute: '분',
    data: {
      nav: ['케어 철학', '트리트먼트', '힐링 공간', 'ORA 소개'],
      book: '체험 예약',
      hero: ['두피부터 깊이 숨 쉬고', '몸과 마음은 천천히 쉬어갑니다', '식물의 힘, 전문적인 손길, 고요한 공간으로 온전히 나만의 시간을 선사합니다.', '트리트먼트 보기'],
      philosophy: ['두피부터 자연스러운 균형을', '두피 관리는 세정을 넘어 촉감과 호흡, 리듬을 느끼는 고요한 의식입니다.', '보태니컬 클렌징', '순한 식물 성분으로 본연의 리듬을 존중합니다.', '맞춤형 케어', '오늘의 상태에 꼭 맞는 케어를 제안합니다.', '깊은 이완', '머리와 목, 어깨의 긴장을 완화합니다.', '지속적인 관리', '한 번의 경험을 편안한 습관으로 이어갑니다.'],
      services: ['세 가지 리듬, 하나의 온전한 쉼', '편안한 상담으로 시작해 지금 필요한 감각을 선택합니다.', '퓨어 리셋', '피지와 잔여물을 부드럽게 씻어 산뜻하게.', '바이탈 글로우', '세정과 영양 케어로 부드럽고 윤기 있게.', '딥 스틸니스', '머리부터 어깨까지 여유롭게 깊은 이완을.', '이 코스 선택'],
      ritual: ['오감을 채우는 온전한 리추얼', '편안한 상담', '습관과 지금의 상태를 살핍니다.', '두피 확인', '두피와 모발을 세심하게 확인합니다.', '보태니컬 클렌징', '부드럽고 산뜻하게 세정합니다.', '릴랙싱 테크닉', '머리부터 어깨까지 이완합니다.', '고요한 회복', '따뜻함과 향기 속에서 회복합니다.'],
      space: ['빛이 내려앉고, 시간은 느려집니다', '부드러운 나무와 따뜻한 석재, 절제된 빛이 공간을 케어의 일부로 만듭니다.', '빛의 복도', '고요한 케어 공간'],
      about: ['자연에서 영감을 얻고, 전문성을 존중합니다', '식물의 영감과 섬세한 테크닉, 현대적인 고요함을 각자의 리듬에 맞춥니다.', '개인 맞춤 케어', '단계의 몰입 경험', '분간의 여유'],
      testimonial: ['이곳에서 다시 나에게 귀 기울입니다', '문을 들어서는 순간부터 시간이 천천히 흐르기 시작했어요.', '딥 스틸니스 · 세 번째 방문', '기분 좋은 고요함, 산뜻한 두피와 부드러운 모발.', '퓨어 리셋 · 첫 체험', '제 상태에 맞춘 리듬에서 진심 어린 배려를 느꼈어요.', '바이탈 글로우 · ORA 멤버'],
      booking: ['나를 위한 고요한 시간', '원하시는 내용을 남기면 일정과 케어를 안내합니다.', '성함', '연락처', '희망 트리트먼트', '희망 날짜', '전하고 싶은 내용', '선택', '예약 신청', '예약 요청이 접수되었습니다. 곧 연락드리겠습니다.', '필수 정보를 입력해 주세요', '올바른 연락처를 입력해 주세요', '예약 문의', '제출 후 전담 담당자가 연락드립니다', '영업시간', '매장 주소', '월요일–일요일 10:00–21:00'],
      mobile: ['홈', '케어', '공간', '예약'],
    },
  },
  de: {
    minute: 'Min.',
    data: {
      nav: ['Philosophie', 'Behandlungen', 'Räume', 'Über ORA'],
      book: 'Ritual buchen',
      hero: ['Lassen Sie Ihre Kopfhaut durchatmen', 'Körper und Geist dürfen zur Ruhe kommen', 'Pflanzenpflege, fachkundige Berührung und ein stiller Raum schenken Ihnen Zeit nur für sich.', 'Behandlungen entdecken'],
      philosophy: ['Natürliches Gleichgewicht beginnt an der Wurzel', 'Kopfhautpflege ist mehr als Reinigung: ein Ritual aus Berührung, Atem und bewusstem Rhythmus.', 'Pflanzliche Reinheit', 'Sanfte Extrakte respektieren Ihren natürlichen Rhythmus.', 'Individuelles Ritual', 'Wir hören zu und stimmen die Pflege auf Sie ab.', 'Tiefe Entspannung', 'Präzise Griffe für Kopf, Nacken und Schultern.', 'Nachhaltige Pflege', 'Ein Erlebnis wird zu einer wohltuenden Gewohnheit.'],
      services: ['Drei Rhythmen. Ein Gefühl der Ruhe.', 'Jede Behandlung beginnt mit einem behutsamen Gespräch. Wählen Sie, was Sie heute brauchen.', 'Klärende Entspannung', 'Sanfte Reinigung bei Talg und Stylingrückständen.', 'Neue Vitalität', 'Reinigung und Pflege für weiches, glänzendes Haar.', 'Tiefe Stille', 'Lange Entspannung vom Kopf bis zu den Schultern.', 'Dieses Ritual wählen'],
      ritual: ['Ein Ritual für alle fünf Sinne', 'Behutsames Gespräch', 'Wir erfahren mehr über Ihr Befinden.', 'Kopfhautanalyse', 'Wir betrachten Kopfhaut und Haar.', 'Pflanzliche Reinigung', 'Sanft gereinigt und erfrischt.', 'Beruhigende Griffe', 'Entspannung von Kopf bis Schultern.', 'Stille Regeneration', 'Wärme und Duft bringen Sie zurück.'],
      space: ['Wo Licht einfällt und Zeit langsamer wird', 'Helles Holz, warmer Stein und sanftes Licht machen den Raum zum Teil des Rituals.', 'Lichtkorridor', 'Stiller Pflegebereich'],
      about: ['Von der Natur inspiriert. Von Fachwissen geleitet.', 'ORA verbindet Pflanzen, präzise Techniken und moderne Ruhe mit Ihrem persönlichen Rhythmus.', 'Persönliche Pflege', 'Sinnliche Phasen', 'Minuten Ruhe'],
      testimonial: ['Hier finden Gäste zu ihrer inneren Stimme', 'Schon beim Eintreten wurde alles langsamer. Jede Berührung war sanft und präzise.', 'Tiefe Stille · Dritter Besuch', 'Die Ruhe war perfekt, meine Kopfhaut frisch und mein Haar weich.', 'Klärende Pflege · Erster Besuch', 'Der Rhythmus passte sich mir an. Ich fühlte mich wirklich umsorgt.', 'Neue Vitalität · ORA Mitglied'],
      booking: ['Schenken Sie sich einen Moment der Ruhe', 'Teilen Sie Ihre Wünsche mit uns. Wir bestätigen Termin und Ritual.', 'Ihr Name', 'Telefonnummer', 'Gewünschtes Ritual', 'Wunschtermin', 'Ihre Nachricht', 'Optional', 'Buchung anfragen', 'Anfrage erhalten. Wir melden uns in Kürze.', 'Bitte Pflichtfelder ausfüllen', 'Bitte gültige Telefonnummer eingeben', 'Reservierung', 'Ihre persönliche Beratung kontaktiert Sie', 'Öffnungszeiten', 'Adresse', 'Montag bis Sonntag, 10:00–21:00 Uhr'],
      mobile: ['Start', 'Pflege', 'Räume', 'Buchen'],
    },
  },
  ru: {
    minute: 'мин',
    data: {
      nav: ['Философия', 'Процедуры', 'Пространство', 'Об ORA'],
      book: 'Записаться',
      hero: ['Позвольте коже головы дышать', 'Позвольте телу и разуму замедлиться', 'Растительный уход, профессиональные техники и тихое пространство — время только для Вас.', 'Смотреть процедуры'],
      philosophy: ['Естественный баланс начинается с корней', 'Уход за кожей головы — больше, чем очищение: это ритуал прикосновений, дыхания и спокойного ритма.', 'Растительное очищение', 'Мягкие экстракты поддерживают естественный ритм.', 'Индивидуальный подход', 'Мы подбираем уход под Ваше состояние.', 'Глубокое расслабление', 'Бережные техники для головы, шеи и плеч.', 'Продолжительный уход', 'Одно впечатление становится привычкой заботы о себе.'],
      services: ['Три ритма. Одно ощущение лёгкости.', 'Каждая процедура начинается с беседы. Выберите ощущение, которое нужно Вам сегодня.', 'Чистота и спокойствие', 'Мягкое очищение от себума и остатков средств.', 'Энергия и сияние', 'Очищение и питание для мягких сияющих волос.', 'Глубокая тишина', 'Долгое расслабление от головы до плеч.', 'Выбрать ритуал'],
      ritual: ['Ритуал для всех пяти чувств', 'Консультация', 'Узнаём о привычках и самочувствии.', 'Диагностика', 'Оцениваем кожу головы и волосы.', 'Очищение', 'Мягко очищаем и освежаем.', 'Расслабление', 'Снимаем напряжение головы и плеч.', 'Спокойное обновление', 'Тепло и аромат возвращают к себе.'],
      space: ['Здесь свет мягче, а время медленнее', 'Светлое дерево, тёплый камень и мягкий свет делают пространство частью ритуала.', 'Галерея света', 'Тихая зона процедур'],
      about: ['Вдохновлено природой. Основано на профессионализме.', 'ORA объединяет растительное вдохновение, точные техники и современное спокойствие в Вашем ритме.', 'Личный уход', 'Этапов погружения', 'Минут спокойствия'],
      testimonial: ['Здесь гости вновь слышат себя', 'Всё замедлилось, как только я вошла. Каждое движение было мягким и точным.', 'Глубокая тишина · Третий визит', 'Идеальная тишина, свежая кожа головы и мягкие волосы.', 'Чистота и спокойствие · Первый визит', 'Ритм подстроили под моё состояние. Я почувствовала настоящую заботу.', 'Энергия и сияние · Участница ORA'],
      booking: ['Подарите себе время в тишине', 'Расскажите о пожеланиях, и мы подтвердим время и процедуру.', 'Ваше имя', 'Телефон', 'Желаемая процедура', 'Желаемая дата', 'Ваше сообщение', 'Необязательно', 'Отправить заявку', 'Заявка получена. Мы скоро свяжемся с Вами.', 'Заполните обязательные поля', 'Введите действительный номер', 'Запись', 'После формы с Вами свяжется консультант', 'Часы работы', 'Адрес', 'Понедельник–воскресенье, 10:00–21:00'],
      mobile: ['Главная', 'Уход', 'Пространство', 'Запись'],
    },
  },
}

const traditionalMap: Record<string, string> = {
  '养': '養', '护': '護', '疗': '療', '愈': '癒', '关': '關', '于': '於', '预': '預', '验': '驗',
  '让': '讓', '头': '頭', '发': '髮', '专业': '專業', '静': '靜', '间': '間', '属': '屬', '净': '淨',
  '选': '選', '节': '節', '从': '從', '张': '張', '松': '鬆', '专': '專', '观': '觀', '当': '當',
  '层': '層', '续': '續', '种': '種', '项': '項', '轻': '輕', '时': '時', '钟': '鐘', '积': '積',
  '残': '殘', '洁': '潔', '丝': '絲', '态': '態', '显': '顯', '颈': '頸', '热': '熱', '仪': '儀',
  '习': '習', '惯': '慣', '状': '狀', '温': '溫', '廊': '廊', '线': '線', '润': '潤', '为': '為',
  '听': '聽', '顾': '顧', '门': '門', '场': '場', '这': '這', '里': '裡', '进': '進', '处': '處',
  '经': '經', '联': '聯', '系': '繫', '营': '營', '业': '業', '周': '週', '员': '員',
  '约': '約', '体': '體', '肤': '膚', '择': '擇', '缓': '緩', '气': '氣', '焕': '煥', '称': '稱', '开': '開',
  '们': '們', '触': '觸', '紧': '緊', '绷': '繃', '渐': '漸', '严': '嚴', '来': '來', '问': '問',
  '询': '詢', '实': '實', '设计': '設計', '带': '帶', '适': '適', '丰': '豐', '结': '結', '顺': '順',
  '泽': '澤', '长': '長', '惫': '憊', '离': '離', '唤': '喚', '谧': '謐', '区': '區', '将': '將',
  '灵': '靈', '学': '學', '标': '標', '准': '準', '倾': '傾', '应': '應', '见': '見', '后': '後',
  '议': '議', '单': '單', '话': '話', '诉': '訴', '页': '頁', '咨': '諮',
  '电': '電', '与': '與', '细': '細', '个': '個', '确': '確', '建议': '建議', '据': '據',
}

function toTraditional<T>(value: T): T {
  if (typeof value === 'string') {
    let result: string = value
    Object.entries(traditionalMap).forEach(([from, to]) => {
      result = result.split(from).join(to)
    })
    return result as T
  }
  if (Array.isArray(value)) return value.map(toTraditional) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toTraditional(item)])) as T
  }
  return value
}

export const copy: Record<Locale, Copy> = {
  zh: baseCopy.zh,
  'zh-TW': toTraditional(baseCopy.zh),
  en: baseCopy.en,
  es: makeCopy('es', packs.es.data, packs.es.minute),
  fr: makeCopy('fr', packs.fr.data, packs.fr.minute),
  ja: makeCopy('ja', packs.ja.data, packs.ja.minute),
  ko: makeCopy('ko', packs.ko.data, packs.ko.minute),
  de: makeCopy('de', packs.de.data, packs.de.minute),
  ru: makeCopy('ru', packs.ru.data, packs.ru.minute),
}
