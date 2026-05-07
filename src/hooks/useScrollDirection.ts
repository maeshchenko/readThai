import { useEffect, useState } from 'react'

type Dir = 'up' | 'down' | 'idle'

interface Options {
  threshold?: number
  topOffset?: number
}

export function useScrollDirection({ threshold = 8, topOffset = 24 }: Options = {}) {
  const [direction, setDirection] = useState<Dir>('idle')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let lastY = window.scrollY
    let ticking = false

    const update = () => {
      const y = window.scrollY
      const diff = y - lastY
      setScrolled(y > topOffset)
      if (Math.abs(diff) >= threshold) {
        setDirection(diff > 0 ? 'down' : 'up')
        lastY = y
      } else if (y <= topOffset) {
        setDirection('idle')
        lastY = y
      }
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold, topOffset])

  return { direction, scrolled }
}
