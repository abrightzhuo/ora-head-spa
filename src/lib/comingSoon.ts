/**
 * 由 index.html 上的 data-coming-soon 标记控制。
 * 新的 index.html 带该标记；index-bak.html 不带，用于随时切换回完整版本。
 */
export function isComingSoon() {
  if (typeof document === 'undefined') return false
  return document.documentElement.dataset.comingSoon === 'true'
}
