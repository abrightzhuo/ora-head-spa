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
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { preview } from 'vite'
import puppeteer from 'puppeteer'

const DIST = path.resolve('dist')
const PORT = 4178
// 预渲染时页面运行在本地端口，canonical / og:url 会被写成 localhost，
// 写出前统一替换为线上域名。
const SITE_ORIGIN = process.env.SITE_ORIGIN ?? 'https://www.myoraspa.com'

/**
 * shell 决定预渲染时的初始 HTML：
 * - /preview 使用 index-bak.html（完整站，无 coming-soon 标记）
 * - 其余页面使用 index.html，与当前线上行为一致（保持站内链接回落到 /preview）
 */
const ROUTES = [
  { route: '/preview', file: 'preview.html', shell: 'index-bak.html' },
  { route: '/about', file: 'about.html', shell: 'index.html' },
  { route: '/gift-cards', file: 'gift-cards.html', shell: 'index.html' },
  { route: '/membership', file: 'membership.html', shell: 'index.html' },
]

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

const writeFallbacks = async () => {
  for (const { file, shell } of ROUTES) {
    await writeFile(path.join(DIST, file), shells.get(shell))
  }
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
  // 让页面按英文默认语言渲染，静态 HTML 与 sitemap / canonical 保持同一语言
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })

  for (const { route, file } of ROUTES) {
    await page.goto(`http://localhost:${PORT}${route}?lang=en`, {
      waitUntil: 'networkidle2',
      timeout: 60_000,
    })
    await page
      .waitForSelector('#root section, #root main, #root header', { timeout: 20_000 })
      .catch(() => {})
    // 等字体与首屏入场动画稳定，避免抓到空壳或闪烁中间态
    await new Promise((resolve) => setTimeout(resolve, 800))

    const raw = await page.content()
    const html = raw
      .split(`http://localhost:${PORT}`)
      .join(SITE_ORIGIN)
      .split(`http://127.0.0.1:${PORT}`)
      .join(SITE_ORIGIN)

    if (html.length < MIN_HTML_LENGTH) {
      throw new Error(`${route} 渲染结果过短（${html.length} 字符），疑似渲染失败`)
    }

    await writeFile(path.join(DIST, file), html)
    log(`${route} -> dist/${file} (${Math.round(html.length / 1024)}KB)`)
  }
} catch (error) {
  console.warn(`[prerender] 预渲染失败，回退为 SPA 外壳：${error.message}`)
  await writeFallbacks()
} finally {
  await browser?.close().catch(() => {})
  await server?.close().catch(() => {})
}

log('done')
