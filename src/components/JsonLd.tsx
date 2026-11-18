import { toJsonLdText } from '../data/structuredData'

type JsonLdProps = {
  data: Record<string, unknown>
  id?: string
}

/**
 * 页面级结构化数据（FAQPage / BreadcrumbList）。
 * 内联 script 会保留在 DOM 里，预渲染抓取时同样会被序列化进静态 HTML。
 */
export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      data-ora={id}
      dangerouslySetInnerHTML={{ __html: toJsonLdText(data) }}
    />
  )
}
