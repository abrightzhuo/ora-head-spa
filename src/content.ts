export const images = {
  logo: '/images/logo.jpg',
  storefront: '/images/storefront.png',
  interiorHall: '/images/interior-01.jpg',
  interiorLounge: '/images/interior-02.png',
}

export type ServiceItem = {
  number: string
  title: string
  english: string
  duration: string
  description: string
  highlights: string[]
}

export type Copy = {
  nav: { label: string; href: string }[]
  book: string
  hero: {
    eyebrow: string
    title: string
    italic: string
    description: string
    explore: string
    note: string
  }
  philosophy: {
    eyebrow: string
    title: string
    body: string
    values: { title: string; text: string }[]
  }
  services: {
    eyebrow: string
    title: string
    intro: string
    items: ServiceItem[]
    choose: string
  }
  ritual: {
    eyebrow: string
    title: string
    steps: { title: string; text: string }[]
  }
  space: {
    eyebrow: string
    title: string
    body: string
    hall: string
    lounge: string
  }
  about: {
    eyebrow: string
    title: string
    body: string
    quote: string
    stats: { value: string; label: string }[]
  }
  testimonial: {
    eyebrow: string
    title: string
    quotes: { text: string; name: string; detail: string }[]
  }
  booking: {
    eyebrow: string
    title: string
    body: string
    name: string
    phone: string
    service: string
    date: string
    message: string
    optional: string
    submit: string
    success: string
    required: string
    phoneError: string
    contact: string
    contactValue: string
    hours: string
    address: string
    hoursValue: string
    addressValue: string
  }
  footer: { statement: string; rights: string }
  mobile: { home: string; care: string; space: string; booking: string }
}

export const baseCopy: Record<'zh' | 'en', Copy> = {
  zh: {
    nav: [
      { label: '养护理念', href: '#philosophy' },
      { label: '护理项目', href: '#services' },
      { label: '疗愈空间', href: '#space' },
      { label: '关于 ORA', href: '#about' },
    ],
    book: '预约体验',
    hero: {
      eyebrow: '草本头皮与肌肤养护',
      title: '让头皮深呼吸',
      italic: '让身心慢下来',
      description: '以草本养护、专业手法与安静空间，为每一次到店留出一段真正属于自己的时间。',
      explore: '探索护理',
      note: '滋养 · 修护 · 焕新',
    },
    philosophy: {
      eyebrow: '我们的养护理念',
      title: '从头开始，找回自然平衡',
      body: '我们相信，好的头皮护理不止于清洁。它是一场关于触感、呼吸与节奏的仪式，在温柔而专业的照料中，让紧绷逐渐松开。',
      values: [
        { title: '草本净护', text: '严选温和植萃，尊重头皮本来的节律。' },
        { title: '专属方案', text: '从问询与观察开始，匹配当下真实需要。' },
        { title: '深层放松', text: '以细致手法舒缓头部、肩颈的日常紧绷。' },
        { title: '持续养护', text: '把一次体验，延伸为长期自在的生活方式。' },
      ],
    },
    services: {
      eyebrow: '特色护理仪式',
      title: '三种节奏，一种松弛',
      intro: '每项护理都从轻柔问询开始。你只需要选择此刻更想靠近的感受。',
      items: [
        {
          number: '01',
          title: '净澈舒缓',
          english: '',
          duration: '60 分钟',
          description: '为容易积聚油脂与造型残留的头皮设计，带来洁净、轻盈的舒适感。',
          highlights: ['头皮观察', '草本净澈', '舒缓按摩'],
        },
        {
          number: '02',
          title: '元气焕活',
          english: '',
          duration: '75 分钟',
          description: '细致清洁与丰润养护相结合，让发丝触感更柔顺，状态更显蓬松有光泽。',
          highlights: ['温和清洁', '丰润养护', '肩颈放松'],
        },
        {
          number: '03',
          title: '深度静享',
          english: '',
          duration: '90 分钟',
          description: '拉长放松的节奏，从头部延伸至肩颈，在安静的触感中卸下一日疲惫。',
          highlights: ['芳香呼吸', '深度手法', '热敷静养'],
        },
      ],
      choose: '选择此项目',
    },
    ritual: {
      eyebrow: 'ORA 护理仪式',
      title: '一场完整的五感仪式',
      steps: [
        { title: '轻柔问询', text: '了解日常习惯与此刻感受' },
        { title: '头皮观察', text: '近距离查看头皮与发丝状态' },
        { title: '草本净护', text: '温和清洁，唤醒清爽触感' },
        { title: '舒缓手法', text: '由头部延伸至肩颈的放松' },
        { title: '静养焕新', text: '在暖意与香气中慢慢回神' },
      ],
    },
    space: {
      eyebrow: '我们的空间',
      title: '光线落下，时间慢了',
      body: '柔和木色、温润石材与克制光影，让空间成为护理的一部分。每一处留白，都为了让感官安静下来。',
      hall: '光影长廊',
      lounge: '静谧护理区',
    },
    about: {
      eyebrow: '关于 ORA',
      title: '汲取自然，也尊重专业',
      body: 'ORA 将植物灵感、细致手法与当代空间美学相结合。我们不追求匆忙的标准流程，而是在每一次触碰前先倾听，让护理回应每个人不同的节奏。',
      quote: '滋养根源，修复节律，由内焕新。',
      stats: [
        { value: '1 : 1', label: '专属护理节奏' },
        { value: '5', label: '步沉浸式体验' },
        { value: '60–90', label: '分钟从容时光' },
      ],
    },
    testimonial: {
      eyebrow: '顾客心声',
      title: '她们在这里，重新听见自己',
      quotes: [
        { text: '从进门开始就慢了下来。护理师的动作很轻，却能照顾到每一个容易紧绷的位置。', name: 'Lina', detail: '深度静享 · 第 3 次到店' },
        { text: '空间安静得刚刚好，做完头皮很清爽，发丝也很柔顺。最喜欢结束前那段热敷。', name: 'Mia', detail: '净澈舒缓 · 首次体验' },
        { text: '不是急着做完一个项目，而是真的根据我的状态调整节奏。这种被认真对待的感觉很好。', name: 'Yuki', detail: '元气焕活 · ORA 会员' },
      ],
    },
    booking: {
      eyebrow: '预约您的护理',
      title: '为自己，留一段安静',
      body: '提交偏好后，我们将与您确认具体时间与护理建议。',
      name: '您的称呼',
      phone: '联系电话',
      service: '意向项目',
      date: '期望日期',
      message: '想告诉我们的事',
      optional: '选填',
      submit: '提交预约',
      success: '预约偏好已收到，我们会尽快与您联系。',
      required: '请完整填写必填信息',
      phoneError: '请输入有效的联系电话',
      contact: '预约咨询',
      contactValue: '提交表单后由专属顾问联系',
      hours: '营业时间',
      address: '门店地址',
      hoursValue: '周一至周日 10:00–21:00',
      addressValue: 'ORA Head Spa & Wellness',
    },
    footer: {
      statement: '滋养 · 修护 · 焕新',
      rights: '© 2026 ORA 草本头皮与肌肤养护',
    },
    mobile: { home: '首页', care: '护理', space: '空间', booking: '预约' },
  },
  en: {
    nav: [
      { label: 'Philosophy', href: '#philosophy' },
      { label: 'Rituals', href: '#services' },
      { label: 'Our Space', href: '#space' },
      { label: 'About ORA', href: '#about' },
    ],
    book: 'Book a Ritual',
    hero: {
      eyebrow: 'HERBAL SCALP & SKIN WELLNESS',
      title: 'Breathe at the roots.',
      italic: 'Return to your rhythm.',
      description: 'Botanical care, considered touch and a quiet space created for the pause you have been needing.',
      explore: 'Explore rituals',
      note: 'NOURISH · RESTORE · RENEW',
    },
    philosophy: {
      eyebrow: 'OUR PHILOSOPHY',
      title: 'Balance begins at the roots',
      body: 'Scalp care can be more than cleansing. We see it as a sensory ritual of touch, breath and unhurried attention, designed to soften the noise of the everyday.',
      values: [
        { title: 'Botanical purity', text: 'Gentle plant-led care that respects your natural rhythm.' },
        { title: 'Personal ritual', text: 'Every visit begins by listening to what you need today.' },
        { title: 'Deep release', text: 'Considered touch across the scalp, neck and shoulders.' },
        { title: 'Lasting care', text: 'A single pause that grows into a more mindful routine.' },
      ],
    },
    services: {
      eyebrow: 'SIGNATURE RITUALS',
      title: 'Three rhythms. One exhale.',
      intro: 'Every ritual begins with a gentle consultation. Simply choose the feeling you would like to return to.',
      items: [
        {
          number: '01',
          title: 'Pure Reset',
          english: '净澈舒缓',
          duration: '60 MIN',
          description: 'A refreshing ritual for scalps prone to oil and product build-up, leaving a clean and weightless feel.',
          highlights: ['Scalp observation', 'Botanical cleanse', 'Soothing massage'],
        },
        {
          number: '02',
          title: 'Vital Glow',
          english: '元气焕活',
          duration: '75 MIN',
          description: 'A considered cleanse and conditioning ritual for softer touch, airy movement and natural-looking shine.',
          highlights: ['Gentle cleanse', 'Conditioning care', 'Neck release'],
        },
        {
          number: '03',
          title: 'Deep Stillness',
          english: '深度静享',
          duration: '90 MIN',
          description: 'An extended ritual that flows from scalp to shoulders, creating room to let go of the day.',
          highlights: ['Aroma breathing', 'Extended touch', 'Warm resting wrap'],
        },
      ],
      choose: 'Choose this ritual',
    },
    ritual: {
      eyebrow: 'THE ORA RITUAL',
      title: 'A five-sense journey',
      steps: [
        { title: 'Gentle consult', text: 'We listen to your habits and how you feel today' },
        { title: 'Scalp observe', text: 'A closer look at your scalp and hair condition' },
        { title: 'Botanical cleanse', text: 'A gentle cleanse for a fresh, weightless feel' },
        { title: 'Considered touch', text: 'Relaxation flowing from scalp to shoulders' },
        { title: 'Quiet renewal', text: 'Return slowly through warmth and natural aroma' },
      ],
    },
    space: {
      eyebrow: 'OUR SPACE',
      title: 'Where light falls and time softens',
      body: 'Pale timber, tactile stone and restrained light make the room part of the ritual. Every pause in the space is designed to quiet the senses.',
      hall: 'The light corridor',
      lounge: 'The quiet lounge',
    },
    about: {
      eyebrow: 'ABOUT ORA',
      title: 'Rooted in nature. Led by care.',
      body: 'ORA brings together botanical inspiration, considered technique and contemporary calm. We listen before every touch, allowing the ritual to meet each guest at their own pace.',
      quote: 'Nourish the roots. Restore the rhythm. Renew from within.',
      stats: [
        { value: '1 : 1', label: 'Personal attention' },
        { value: '5', label: 'Immersive stages' },
        { value: '60–90', label: 'Minutes of pause' },
      ],
    },
    testimonial: {
      eyebrow: 'GUEST NOTES',
      title: 'Quiet words from our guests',
      quotes: [
        { text: 'Everything slowed down the moment I stepped inside. The touch was gentle yet somehow found every place I carried tension.', name: 'Lina', detail: 'Deep Stillness · Third visit' },
        { text: 'The space is quiet in exactly the right way. My scalp felt fresh, my hair soft, and the warm wrap at the end was perfect.', name: 'Mia', detail: 'Pure Reset · First visit' },
        { text: 'It never felt like a rushed standard service. The pace changed with how I felt, and that attention made all the difference.', name: 'Yuki', detail: 'Vital Glow · ORA member' },
      ],
    },
    booking: {
      eyebrow: 'RESERVE YOUR RITUAL',
      title: 'Make room for quiet',
      body: 'Share your preferences and our team will be in touch to confirm your time and ritual.',
      name: 'Your name',
      phone: 'Phone number',
      service: 'Preferred ritual',
      date: 'Preferred date',
      message: 'Anything we should know',
      optional: 'Optional',
      submit: 'Request a booking',
      success: 'Your preference has been received. We will be in touch shortly.',
      required: 'Please complete all required fields',
      phoneError: 'Please enter a valid phone number',
      contact: 'Reservations',
      contactValue: 'Your concierge will contact you',
      hours: 'Opening hours',
      address: 'Visit us',
      hoursValue: 'Monday to Sunday, 10:00–21:00',
      addressValue: 'ORA Head Spa & Wellness',
    },
    footer: {
      statement: 'Nourish · Restore · Renew',
      rights: '© 2026 ORA Herbal Scalp & Skin Wellness',
    },
    mobile: { home: 'Home', care: 'Rituals', space: 'Space', booking: 'Book' },
  },
}
