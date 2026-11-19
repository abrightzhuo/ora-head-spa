/**
 * 构建期预渲染（方案 A）。
 *
 * 背景：站点是 Vite + React 的纯 CSR 单页应用，服务器只返回空的 <div id="root">，
 * 不执行 JS 的抓取器（GPTBot / PerplexityBot / ClaudeBot 等）读不到任何正文。
 *
 * 做法：vite build 之后启动本地 preview 服务，用无头 Chrome 打开每个公开路由，
 * 等 React 渲染完成再把完整 DOM 序列化成静态 HTML，写到 dist/<route>.html。
 * Vercel 侧由 vercel.json 把对应路径重写到这些文件。
 *
 * 兜底：若浏览器启动或抓取失败，则写入 SPA 外壳（index-bak.html / index.html），
 * 保证路由不会 404，只是退化成原来的客户端渲染。
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { preview } from 'vite'
import puppeteer from 'puppeteer'

const DIST = path.resolve('dist')
const PORT = 4178
// 预渲染时页面运行在本地端口，canonical / og:url 会被写成 localhost，
// 写出前统一替换为线上域名。
const SITE_ORIGIN = process.env.SITE_ORIGIN ?? 'https://www.myoraspa.com'

/**
 * 语言路径（P3）：英文无前缀，其它语言各有一个可索引的前缀。
 * 与 src/lib/localeRouting.ts 的 LOCALE_SLUGS 保持一致。
 */
const LOCALES = [
  { code: 'en', prefix: '' },
  { code: 'zh', prefix: 'zh' },
  { code: 'zh-TW', prefix: 'zh-tw' },
  { code: 'es', prefix: 'es' },
  { code: 'fr', prefix: 'fr' },
  { code: 'ja', prefix: 'ja' },
  { code: 'ko', prefix: 'ko' },
  { code: 'de', prefix: 'de' },
  { code: 'ru', prefix: 'ru' },
]

const SUB_PAGES = ['about', 'gift-cards', 'membership']

/** 与 src/lib/locales.ts 的 htmlLang 一致，用于校验渲染语言 */
const HTML_LANG = {
  en: 'en',
  zh: 'zh-CN',
  'zh-TW': 'zh-TW',
  es: 'es',
  fr: 'fr',
  ja: 'ja',
  ko: 'ko',
  de: 'de',
  ru: 'ru',
}

/**
 * shell 决定预渲染时的初始 HTML：
 * - 首页（/preview、/es、/zh-tw …）使用 index-bak.html（完整站，无 coming-soon 标记）
 * - 子页面使用 index.html，与当前线上行为一致
 *
 * 文件路径与 URL 一一对应（/es/about -> dist/es/about.html），
 * 这样 Vercel 可以直接按静态文件命中，省掉重写规则。
 */
const ROUTES = LOCALES.flatMap(({ code, prefix }) => [
  {
    lang: code,
    route: prefix ? `/${prefix}` : '/preview',
    file: prefix ? `${prefix}/index.html` : 'preview.html',
    shell: 'index-bak.html',
  },
  ...SUB_PAGES.map((page) => ({
    lang: code,
    route: prefix ? `/${prefix}/${page}` : `/${page}`,
    file: prefix ? `${prefix}/${page}.html` : `${page}.html`,
    shell: 'index.html',
  })),
])

const MIN_HTML_LENGTH = 5000

const log = (message) => console.log(`[prerender] ${message}`)

const CHROME_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--hide-scrollbars',
]

/**
 * Chrome 解析顺序：
 * 1. 显式指定 PUPPETEER_EXECUTABLE_PATH
 * 2. 系统已安装的 Chrome / Chromium（本地开发机常见）
 * 3. puppeteer 自带的 Chromium（CI / Vercel 构建机）
 */
const systemChrome = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find((candidate) => candidate && existsSync(candidate))

const launchBrowser = async () => {
  if (systemChrome) {
    log(`使用本地浏览器：${systemChrome}`)
    return puppeteer.launch({ headless: true, executablePath: systemChrome, args: CHROME_ARGS })
  }

  // CI / Vercel：npm 会拦截 puppeteer 的 postinstall，自带的 Chromium 并不存在，
  // 因此优先使用 @sparticuz/chromium 提供的可执行文件（构建时解压到 /tmp）。
  try {
    const { default: chromium } = await import('@sparticuz/chromium')
    const executablePath = await chromium.executablePath()
    if (executablePath) {
      log(`使用 @sparticuz/chromium：${executablePath}`)
      return await puppeteer.launch({
        headless: true,
        executablePath,
        args: [...CHROME_ARGS, ...chromium.args],
      })
    }
  } catch (error) {
    log(`@sparticuz/chromium 不可用：${error.message}`)
  }

  try {
    return await puppeteer.launch({ headless: true, args: CHROME_ARGS })
  } catch {
    return puppeteer.launch({ headless: true, channel: 'chrome', args: CHROME_ARGS })
  }
}

const shells = new Map()
for (const { shell } of ROUTES) {
  if (!shells.has(shell)) {
    shells.set(shell, await readFile(path.join(DIST, shell), 'utf8'))
  }
}

const writeOutput = async (file, html) => {
  const target = path.join(DIST, file)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, html)
}

const writeFallbacks = async () => {
  for (const { file, shell } of ROUTES) {
    await writeOutput(file, shells.get(shell))
  }
}

/**
 * sitemap 由路由表生成，避免手写后再漏掉新增语言。
 * public/sitemap.xml 只是开发环境的英文兜底，线上以这里产出的为准。
 */
const priorityOf = (route) => {
  if (route.endsWith('/about')) return '0.8'
  if (/\/(gift-cards|membership)$/.test(route)) return '0.6'
  return '1.0'
}

const changefreqOf = (route) => (priorityOf(route) === '1.0' ? 'weekly' : 'monthly')

const writeSitemap = async () => {
  const today = new Date().toISOString().slice(0, 10)
  const urls = ROUTES.map(
    ({ route }) => `  <url>
    <loc>${SITE_ORIGIN}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreqOf(route)}</changefreq>
    <priority>${priorityOf(route)}</priority>
  </url>`,
  ).join('\n')

  await writeOutput(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
  )
  log(`sitemap -> dist/sitemap.xml（${ROUTES.length} 条）`)
}

let server
let browser

try {
  server = await preview({
    preview: { port: PORT, strictPort: true },
    logLevel: 'warn',
  })

  browser = await launchBrowser()

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  for (const { route, file, lang } of ROUTES) {
    // 路径前缀已经决定语言，这里再声明一次 Accept-Language，保证首屏文案一致
    await page.setExtraHTTPHeaders({ 'Accept-Language': `${lang},en;q=0.9` })
    await page.goto(`http://localhost:${PORT}${route}?lang=${encodeURIComponent(lang)}`, {
      waitUntil: 'networkidle2',
      timeout: 60_000,
    })
    await page
      .waitForSelector('#root section, #root main, #root header', { timeout: 20_000 })
      .catch(() => {})
    // 等字体与首屏入场动画稳定，避免抓到空壳或闪烁中间态
    await new Promise((resolve) => setTimeout(resolve, 800))

    const renderedLang = await page.evaluate(() => document.documentElement.lang)
    if (renderedLang.toLowerCase() !== HTML_LANG[lang].toLowerCase()) {
      log(`警告：${route} 渲染语言为 ${renderedLang}，期望 ${HTML_LANG[lang]}`)
    }

    const raw = await page.content()
    const html = raw
      .split(`http://localhost:${PORT}`)
      .join(SITE_ORIGIN)
      .split(`http://127.0.0.1:${PORT}`)
      .join(SITE_ORIGIN)

    if (html.length < MIN_HTML_LENGTH) {
      throw new Error(`${route} 渲染结果过短（${html.length} 字符），疑似渲染失败`)
    }

    await writeOutput(file, html)
    log(`${route} -> dist/${file} (${Math.round(html.length / 1024)}KB)`)
  }

  await writeSitemap()
} catch (error) {
  console.warn(`[prerender] 预渲染失败，回退为 SPA 外壳：${error.message}`)
  await writeFallbacks()
} finally {
  await browser?.close().catch(() => {})
  await server?.close().catch(() => {})
}

log('done')
