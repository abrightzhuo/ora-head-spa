import { defineConfig, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { siteGraph, toJsonLdText } from './src/data/structuredData'

/**
 * vercel.json 会把 /preview 与 /full 重写到 index-bak.html（完整站点）。
 * 本地 vite dev / preview 没有这条重写规则，会回落到 index.html（coming-soon），
 * 导致导航可见但页面只有 Hero。这里在本地补上同样的重写。
 */
const rewriteSitePreview = (url?: string) => {
  const match = url?.match(/^\/(?:preview|full)\/?(\?.*)?$/)
  return match ? `/index-bak.html${match[1] ?? ''}` : undefined
}

const serveSitePreview: Connect.NextHandleFunction = (req, _res, next) => {
  const target = rewriteSitePreview(req.url)
  if (target) req.url = target
  next()
}

const sitePreviewRoutes = (): Plugin => ({
  name: 'ora-site-preview-routes',
  configureServer(server) {
    server.middlewares.use(serveSitePreview)
  },
  configurePreviewServer(server) {
    server.middlewares.use(serveSitePreview)
  },
})

/**
 * 把站点级 JSON-LD（Organization / HealthAndBeautyBusiness / Service ×3 / Offer ×2）
 * 直接写进每个 HTML 外壳的 <head>。这样即使不执行 JS 的抓取器（GPTBot、PerplexityBot 等）
 * 也能读到实体信息，且预渲染产物会原样继承这段脚本。
 */
const siteJsonLd = (): Plugin => ({
  name: 'ora-site-json-ld',
  transformIndexHtml(html) {
    const json = toJsonLdText(siteGraph())
    const tag = `<script type="application/ld+json" data-ora="site-graph">${json}</script>`
    return html.replace('</head>', `  ${tag}\n  </head>`)
  },
})

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      input: {
        main: 'index.html',
        preview: 'index-bak.html',
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://www.myoraspa.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [
    siteJsonLd(),
    sitePreviewRoutes(),
    react({
      babel: {
        // react-dev-locator 只在开发时使用：它会给每个 DOM 节点写上
        // trae-inspector-* 属性（含本机绝对路径），生产构建与预渲染产物都不能带。
        plugins: command === 'serve' ? ['react-dev-locator'] : [],
      },
    }),
    tsconfigPaths()
  ],
}))
