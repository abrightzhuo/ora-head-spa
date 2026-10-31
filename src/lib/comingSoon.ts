/**
 * 由 index.html 上的 data-coming-soon 标记控制。
 * 新的 index.html 带该标记；index-bak.html 不带，用于随时切换回完整版本。
 */
export function isComingSoon() {
  if (typeof document === 'undefined') return false
  return document.documentElement.dataset.comingSoon === 'true'
}

/**
 * While the root page is still the coming-soon landing page, the complete site
 * lives at /preview (index-bak.html). All "back home" style links go there so
 * visitors are not dropped onto the landing page.
 */
export function siteHomePath() {
  return isComingSoon() ? '/preview' : '/'
}
