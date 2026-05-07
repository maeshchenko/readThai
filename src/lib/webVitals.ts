export function reportWebVitals() {
  if (!import.meta.env.DEV) return
  if (typeof window === 'undefined') return
  import('web-vitals')
    .then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const log = (m: { name: string; value: number; rating?: string }) => {
        // eslint-disable-next-line no-console
        console.log(`[web-vitals] ${m.name}: ${m.value.toFixed(2)} (${m.rating ?? 'n/a'})`)
      }
      onCLS(log)
      onINP(log)
      onLCP(log)
      onFCP(log)
      onTTFB(log)
    })
    .catch(() => { /* noop */ })
}
