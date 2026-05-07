import { useEffect } from 'react'

export function useLockBody(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return
    const original = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    }
    const sbw = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`
    return () => {
      document.body.style.overflow = original.overflow
      document.body.style.paddingRight = original.paddingRight
    }
  }, [locked])
}
