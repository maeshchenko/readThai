export function registerServiceWorker() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) return

  window.addEventListener('load', () => {
    const url = `${import.meta.env.BASE_URL}sw.js`
    navigator.serviceWorker
      .register(url, { scope: import.meta.env.BASE_URL })
      .catch(() => { /* ignore */ })
  })
}
