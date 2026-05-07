import { create } from 'zustand'

interface AudioState {
  currentTrackId: string | null
  play: (trackId: string) => void
  stop: () => void
}

export const useAudioStore = create<AudioState>((set) => ({
  currentTrackId: null,
  play: (trackId) => set({ currentTrackId: trackId }),
  stop: () => set({ currentTrackId: null }),
}))

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (t: Theme) => void
}

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  return 'system'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getInitialTheme()
  applyTheme(initial)
  return {
    theme: initial,
    setTheme: (theme) => {
      localStorage.setItem('theme', theme)
      applyTheme(theme)
      set({ theme })
    },
  }
})

export type ThaiScript = 'looped' | 'loopless'

interface ThaiScriptState {
  primary: ThaiScript
  showBoth: boolean
  setPrimary: (s: ThaiScript) => void
  setShowBoth: (v: boolean) => void
}

function getInitialScript(): { primary: ThaiScript; showBoth: boolean } {
  try {
    const raw = localStorage.getItem('thaiScript')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        primary: parsed.primary === 'loopless' ? 'loopless' : 'looped',
        showBoth: parsed.showBoth ?? true,
      }
    }
  } catch { /* ignore */ }
  return { primary: 'looped', showBoth: true }
}

export const useThaiScriptStore = create<ThaiScriptState>((set, get) => {
  const initial = getInitialScript()
  return {
    ...initial,
    setPrimary: (primary) => {
      const state = { ...get(), primary }
      localStorage.setItem('thaiScript', JSON.stringify({ primary: state.primary, showBoth: state.showBoth }))
      set({ primary })
    },
    setShowBoth: (showBoth) => {
      const state = { ...get(), showBoth }
      localStorage.setItem('thaiScript', JSON.stringify({ primary: state.primary, showBoth: state.showBoth }))
      set({ showBoth })
    },
  }
})

interface ProgressState {
  listenedTracks: Set<number>
  lastChapter: string | null
  markListened: (trackNum: number) => void
  setLastChapter: (slug: string) => void
}

function loadProgress() {
  try {
    const raw = localStorage.getItem('progress')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        listenedTracks: new Set<number>(parsed.listenedTracks ?? []),
        lastChapter: parsed.lastChapter ?? null,
      }
    }
  } catch { /* ignore */ }
  return { listenedTracks: new Set<number>(), lastChapter: null }
}

function saveProgress(state: { listenedTracks: Set<number>; lastChapter: string | null }) {
  localStorage.setItem(
    'progress',
    JSON.stringify({
      listenedTracks: [...state.listenedTracks],
      lastChapter: state.lastChapter,
    }),
  )
}

export const useProgressStore = create<ProgressState>((set, get) => {
  const initial = loadProgress()
  return {
    ...initial,
    markListened: (trackNum) => {
      const next = new Set(get().listenedTracks)
      next.add(trackNum)
      const state = { ...get(), listenedTracks: next }
      saveProgress(state)
      set({ listenedTracks: next })
    },
    setLastChapter: (slug) => {
      const state = { ...get(), lastChapter: slug }
      saveProgress(state)
      set({ lastChapter: slug })
    },
  }
})
