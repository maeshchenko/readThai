let ctx: AudioContext | null = null

export function useTone() {
  return (freq = 320, dur = 0.12) => {
    try {
      if (!ctx) {
        const C = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
        ctx = new C()
      }
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.value = 0
      g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.005)
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + dur)
      o.connect(g)
      g.connect(ctx.destination)
      o.start()
      o.stop(ctx.currentTime + dur + 0.02)
    } catch { /* noop */ }
  }
}
