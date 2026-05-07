type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 8,
  medium: 14,
  heavy: 22,
  selection: 5,
  success: [12, 30, 12],
  warning: [18, 50, 18],
  error: [22, 60, 22, 60, 22],
}

export function haptic(pattern: HapticPattern = 'light') {
  if (typeof window === 'undefined') return
  if (!('vibrate' in navigator)) return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  try {
    navigator.vibrate(PATTERNS[pattern])
  } catch {
    /* noop */
  }
}
