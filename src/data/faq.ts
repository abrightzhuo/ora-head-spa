/**
 * 页面 FAQ 与 FAQPage 结构化数据的唯一来源。
 * 页面渲染和 JSON-LD 都读这份数组，保证「一一对应」。
 *
 * 每条答案控制在 40–60 词：先给结论句（含数字/地名），再补细节，方便 AI 直接摘引。
 */
export type FaqItem = {
  question: string
  answer: string
  questionZh: string
  answerZh: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is the difference between a head spa and a regular shampoo?',
    answer:
      'A head spa is a 60 to 90 minute scalp treatment, not a wash-and-go. At ORA the therapist checks your scalp, cleanses it with warm botanical water, massages scalp, neck and shoulders, then leaves you to rest. A regular shampoo cleans hair in minutes; a head spa treats the scalp.',
    questionZh: '头皮 SPA 和普通洗头有什么区别？',
    answerZh:
      '头皮 SPA 是一次 60 到 90 分钟的头皮护理，而非快速洗头。在 ORA，理疗师先做头皮观察，再用温热草本水清洁，配合头部、颈肩按摩，最后留出静养时间。普通洗头几分钟清洁发丝，头皮 SPA 照顾的是头皮本身。',
  },
  {
    question: 'How often should you book a head spa session?',
    answer:
      'It depends on your scalp. Oily or congested scalps usually settle with a 60 minute Pure Reset every three to four weeks, while dry or sensitive scalps often prefer a 75 minute Vital Glow less often. Your therapist suggests a rhythm after the first scalp check.',
    questionZh: '多久做一次头皮 SPA 比较合适？',
    answerZh:
      '取决于头皮状态。油性或容易堆积残留的头皮，通常每三到四周做一次 60 分钟的净澈舒缓；干燥或敏感头皮更适合间隔更久做 75 分钟的元气焕活。首次头皮观察后，理疗师会给出适合你的节奏。',
  },
  {
    question: 'Can I book if I am pregnant or have a sensitive scalp?',
    answer:
      'Yes, with a note at booking. We keep pressure light, skip strong essential oils and heat on request, and adjust the ritual to what feels comfortable. Tell us about pregnancy, allergies, scalp conditions or recent treatments so the therapist can adapt — and check with your doctor if unsure.',
    questionZh: '孕期或敏感头皮可以做吗？',
    answerZh:
      '可以，预约时备注即可。我们会用较轻的手法，按需避开浓烈精油与热敷，并把流程调整到你觉得舒适的强度。请告知孕期、过敏、头皮状况或近期护理项目，方便理疗师调整；如有疑虑，请先咨询医生。',
  },
  {
    question: 'What should I do before my first head spa visit?',
    answer:
      'Come as you are: there is no need to wash your hair, and skip heavy styling products if you can. Arrive five minutes early so we can run the scalp check, talk through the 60, 75 and 90 minute rituals and choose what suits you. Robes, towels and the herbal cleanse are provided.',
    questionZh: '第一次来做头皮 SPA 需要准备什么？',
    answerZh:
      '不需要特别准备，也不必提前洗头；如果方便，尽量少用厚重造型产品。建议提前五分钟到店，我们会先做头皮观察，说明 60、75、90 分钟三种流程的区别，再一起选择适合的项目。浴袍、毛巾与草本清洁都由我们提供。',
  },
  {
    question: 'Do I need an appointment at ORA?',
    answer:
      'Yes — rituals are by appointment. Choose a service and a time on our booking page, where the calendar shows live availability. Walk-ins depend on the day’s schedule, so booking ahead is the only way to secure a specific day, time and therapist.',
    questionZh: '需要提前预约吗？',
    answerZh:
      '需要，护理按预约进行。在预约页面选择项目与时间即可看到实时可约时段。临时到店要看当天排期，想指定日期、时段或理疗师，请提前在线预约。',
  },
  {
    question: 'How much does a head spa at ORA cost?',
    answer:
      'Rituals are $179 for 60 minutes (Pure Reset), $169 for 75 minutes (Vital Glow) and $188.99 for 90 minutes (Deep Stillness). Gift cards run from $25 to $1,000, and the annual membership is $288 with 10% off every ritual, one complimentary ritual and 20% off retail.',
    questionZh: 'ORA 头皮 SPA 价格是多少？',
    answerZh:
      '60 分钟净澈舒缓 $179，75 分钟元气焕活 $169，90 分钟深度静享 $188.99。礼品卡面额 $25 至 $1,000；年度会员 $288，含所有护理 9 折、一次免费护理与零售产品 8 折。',
  },
  {
    question: 'Where is ORA Head Spa and when is it open?',
    answer:
      'ORA is in Waltham, Massachusetts, and open Monday to Sunday from 10:00 to 21:00. Booking, gift cards and membership are handled on myoraspa.com, and the rituals take place in the Waltham studio.',
    questionZh: 'ORA 在哪里？营业时间是？',
    answerZh:
      'ORA 位于马萨诸塞州 Waltham，营业时间为周一至周日 10:00 至 21:00。预约、礼品卡与会员均可在 myoraspa.com 办理，护理在 Waltham 门店进行。',
  },
  {
    question: 'What happens during an ORA ritual, step by step?',
    answer:
      'Every ritual follows five steps: a short consultation, a close scalp check, a warm botanical cleanse, slow massage from scalp to neck and shoulders, then a quiet rest. The three rituals differ in time and depth, not in sequence.',
    questionZh: 'ORA 的护理流程是怎样的？',
    answerZh:
      '所有护理都按五个步骤进行：简短问询、近距离头皮观察、温热草本清洁、从头部延伸到颈肩的舒缓手法、最后静养回神。三种项目的差别在时长与深度，而不是流程顺序。',
  },
]
