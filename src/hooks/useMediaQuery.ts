import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false)
  const [matches, setMatches] = useState<boolean>(get)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(query)
    const handler = () => setMatches(mql.matches)
    handler()
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 767.98px)')
}

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
