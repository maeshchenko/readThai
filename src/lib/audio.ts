import { create } from 'zustand'

export interface Track {
  id: string
  number: number
  src: string
  label: string
  chapterSlug?: string
  chapterTitle?: string
}

interface AudioState {
  track: Track | null
  isPlaying: boolean
  isLoading: boolean
  duration: number
  currentTime: number
  playbackRate: number
  autoNext: boolean
  loop: boolean
  sleepTimerEndsAt: number | null
  miniHidden: boolean
  showNowPlaying: boolean
  loadAndPlay: (track: Track) => Promise<void>
  togglePlay: () => void
  pause: () => void
  resume: () => Promise<void>
  stop: () => void
  seek: (time: number) => void
  seekRelative: (delta: number) => void
  setRate: (r: number) => void
  setAutoNext: (v: boolean) => void
  setLoop: (v: boolean) => void
  setSleepTimer: (mins: number | null) => void
  hideMini: () => void
  setShowNowPlaying: (v: boolean) => void
  setProgress: (currentTime: number, duration: number) => void
  setIsPlaying: (v: boolean) => void
  setIsLoading: (v: boolean) => void
}

const persistKey = 'audioPrefs'

interface PersistedPrefs {
  playbackRate?: number
  autoNext?: boolean
  loop?: boolean
}

function loadPrefs(): PersistedPrefs {
  try {
    const raw = localStorage.getItem(persistKey)
    if (raw) return JSON.parse(raw) as PersistedPrefs
  } catch { /* ignore */ }
  return {}
}

function savePrefs(prefs: PersistedPrefs) {
  try { localStorage.setItem(persistKey, JSON.stringify(prefs)) } catch { /* ignore */ }
}

const initialPrefs = loadPrefs()

let audioEl: HTMLAudioElement | null = null
let endHandlers: Array<() => void> = []

export function getAudioElement(): HTMLAudioElement {
  if (typeof window === 'undefined') {
    throw new Error('audio element requires window')
  }
  if (!audioEl) {
    audioEl = new Audio()
    audioEl.preload = 'metadata'
    audioEl.crossOrigin = 'anonymous'
  }
  return audioEl
}

export function onTrackEnded(handler: () => void) {
  endHandlers.push(handler)
  return () => {
    endHandlers = endHandlers.filter((h) => h !== handler)
  }
}

export function fireEnded() {
  for (const h of endHandlers) {
    try { h() } catch { /* noop */ }
  }
}

export const useAudio = create<AudioState>((set, get) => ({
  track: null,
  isPlaying: false,
  isLoading: false,
  duration: 0,
  currentTime: 0,
  playbackRate: initialPrefs.playbackRate ?? 1,
  autoNext: initialPrefs.autoNext ?? true,
  loop: initialPrefs.loop ?? false,
  sleepTimerEndsAt: null,
  miniHidden: false,
  showNowPlaying: false,
  loadAndPlay: async (track) => {
    const el = getAudioElement()
    const cur = get()
    if (cur.track?.id === track.id) {
      if (!cur.isPlaying) {
        try {
          await el.play()
          set({ isPlaying: true })
        } catch { /* noop */ }
      }
      return
    }
    set({ track, isLoading: true, currentTime: 0, duration: 0, miniHidden: false })
    el.src = track.src
    el.playbackRate = cur.playbackRate
    el.loop = cur.loop
    try {
      await el.play()
      set({ isPlaying: true, isLoading: false })
    } catch {
      set({ isPlaying: false, isLoading: false })
    }
  },
  togglePlay: () => {
    const el = getAudioElement()
    const cur = get()
    if (!cur.track) return
    if (cur.isPlaying) {
      el.pause()
      set({ isPlaying: false })
    } else {
      el.play().then(() => set({ isPlaying: true })).catch(() => { /* noop */ })
    }
  },
  pause: () => {
    const el = getAudioElement()
    el.pause()
    set({ isPlaying: false })
  },
  resume: async () => {
    const el = getAudioElement()
    try {
      await el.play()
      set({ isPlaying: true })
    } catch { /* noop */ }
  },
  stop: () => {
    const el = getAudioElement()
    el.pause()
    el.currentTime = 0
    set({ isPlaying: false, currentTime: 0, miniHidden: true })
  },
  seek: (time) => {
    const el = getAudioElement()
    if (Number.isFinite(time)) {
      el.currentTime = Math.max(0, Math.min(time, el.duration || time))
      set({ currentTime: el.currentTime })
    }
  },
  seekRelative: (delta) => {
    const el = getAudioElement()
    el.currentTime = Math.max(0, Math.min((el.currentTime || 0) + delta, el.duration || 0))
    set({ currentTime: el.currentTime })
  },
  setRate: (r) => {
    const el = getAudioElement()
    el.playbackRate = r
    set({ playbackRate: r })
    const prefs = loadPrefs()
    savePrefs({ ...prefs, playbackRate: r })
  },
  setAutoNext: (v) => {
    set({ autoNext: v })
    const prefs = loadPrefs()
    savePrefs({ ...prefs, autoNext: v })
  },
  setLoop: (v) => {
    const el = getAudioElement()
    el.loop = v
    set({ loop: v })
    const prefs = loadPrefs()
    savePrefs({ ...prefs, loop: v })
  },
  setSleepTimer: (mins) => {
    set({ sleepTimerEndsAt: mins == null ? null : Date.now() + mins * 60 * 1000 })
  },
  hideMini: () => set({ miniHidden: true }),
  setShowNowPlaying: (v) => set({ showNowPlaying: v }),
  setProgress: (currentTime, duration) => set({ currentTime, duration }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setIsLoading: (v) => set({ isLoading: v }),
}))
