import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (t: Theme) => void
}

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* ignore */ }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getInitialTheme()
  if (typeof document !== 'undefined') applyTheme(initial)
  return {
    theme: initial,
    setTheme: (theme) => {
      try { localStorage.setItem('theme', theme) } catch { /* ignore */ }
      applyTheme(theme)
      set({ theme })
    },
  }
})

interface ProgressState {
  listenedTracks: Set<number>
  lastChapter: string | null
  bookmarks: string[]
  markListened: (trackNum: number) => void
  setLastChapter: (slug: string) => void
  toggleBookmark: (slug: string) => void
  reset: () => void
}

interface PersistedProgress {
  listenedTracks?: number[]
  lastChapter?: string | null
  bookmarks?: string[]
}

function loadProgress() {
  try {
    const raw = localStorage.getItem('progress')
    if (raw) {
      const parsed: PersistedProgress = JSON.parse(raw)
      return {
        listenedTracks: new Set<number>(parsed.listenedTracks ?? []),
        lastChapter: parsed.lastChapter ?? null,
        bookmarks: parsed.bookmarks ?? [],
      }
    }
  } catch { /* ignore */ }
  return {
    listenedTracks: new Set<number>(),
    lastChapter: null,
    bookmarks: [] as string[],
  }
}

function saveProgress(state: Pick<ProgressState, 'listenedTracks' | 'lastChapter' | 'bookmarks'>) {
  try {
    localStorage.setItem(
      'progress',
      JSON.stringify({
        listenedTracks: [...state.listenedTracks],
        lastChapter: state.lastChapter,
        bookmarks: state.bookmarks,
      }),
    )
  } catch { /* ignore */ }
}

export const useProgressStore = create<ProgressState>((set, get) => {
  const initial = loadProgress()
  return {
    ...initial,
    markListened: (trackNum) => {
      const cur = get()
      if (cur.listenedTracks.has(trackNum)) return
      const next = new Set(cur.listenedTracks)
      next.add(trackNum)
      const state = { ...cur, listenedTracks: next }
      saveProgress(state)
      set({ listenedTracks: next })
    },
    setLastChapter: (slug) => {
      const state = { ...get(), lastChapter: slug }
      saveProgress(state)
      set({ lastChapter: slug })
    },
    toggleBookmark: (slug) => {
      const cur = get()
      const s = new Set(cur.bookmarks)
      if (s.has(slug)) s.delete(slug)
      else s.add(slug)
      const arr = [...s]
      const state = { ...cur, bookmarks: arr }
      saveProgress(state)
      set({ bookmarks: arr })
    },
    reset: () => {
      const empty = { listenedTracks: new Set<number>(), lastChapter: null, bookmarks: [] as string[] }
      saveProgress(empty)
      set(empty)
    },
  }
})
