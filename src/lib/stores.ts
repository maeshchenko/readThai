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
  lastStudyDate: string | null
  streakDays: number
  todayCount: number
  bookmarks: string[]
  markListened: (trackNum: number) => void
  setLastChapter: (slug: string) => void
  toggleBookmark: (slug: string) => void
}

interface PersistedProgress {
  listenedTracks?: number[]
  lastChapter?: string | null
  lastStudyDate?: string | null
  streakDays?: number
  todayCount?: number
  bookmarks?: string[]
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayDiff(aISO: string, bISO: string): number {
  const a = new Date(aISO + 'T00:00:00')
  const b = new Date(bISO + 'T00:00:00')
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function loadProgress() {
  try {
    const raw = localStorage.getItem('progress')
    if (raw) {
      const parsed: PersistedProgress = JSON.parse(raw)
      const today = todayISO()
      let streakDays = parsed.streakDays ?? 0
      let todayCount = parsed.todayCount ?? 0
      if (parsed.lastStudyDate && parsed.lastStudyDate !== today) {
        const diff = dayDiff(parsed.lastStudyDate, today)
        if (diff > 1) streakDays = 0
        todayCount = 0
      }
      return {
        listenedTracks: new Set<number>(parsed.listenedTracks ?? []),
        lastChapter: parsed.lastChapter ?? null,
        lastStudyDate: parsed.lastStudyDate ?? null,
        streakDays,
        todayCount,
        bookmarks: parsed.bookmarks ?? [],
      }
    }
  } catch { /* ignore */ }
  return {
    listenedTracks: new Set<number>(),
    lastChapter: null,
    lastStudyDate: null,
    streakDays: 0,
    todayCount: 0,
    bookmarks: [],
  }
}

function saveProgress(state: Pick<ProgressState, 'listenedTracks' | 'lastChapter' | 'lastStudyDate' | 'streakDays' | 'todayCount' | 'bookmarks'>) {
  const payload: PersistedProgress = {
    listenedTracks: [...state.listenedTracks],
    lastChapter: state.lastChapter,
    lastStudyDate: state.lastStudyDate,
    streakDays: state.streakDays,
    todayCount: state.todayCount,
    bookmarks: state.bookmarks,
  }
  localStorage.setItem('progress', JSON.stringify(payload))
}

export const useProgressStore = create<ProgressState>((set, get) => {
  const initial = loadProgress()
  return {
    ...initial,
    markListened: (trackNum) => {
      const cur = get()
      const next = new Set(cur.listenedTracks)
      const wasNew = !next.has(trackNum)
      next.add(trackNum)
      const today = todayISO()
      let streak = cur.streakDays
      let todayCount = cur.todayCount
      if (cur.lastStudyDate !== today) {
        if (cur.lastStudyDate) {
          const diff = dayDiff(cur.lastStudyDate, today)
          if (diff === 1) streak += 1
          else if (diff > 1) streak = 1
        } else {
          streak = 1
        }
        todayCount = 0
      } else if (streak === 0) {
        streak = 1
      }
      if (wasNew) todayCount += 1
      const state = {
        ...cur,
        listenedTracks: next,
        lastStudyDate: today,
        streakDays: streak,
        todayCount,
      }
      saveProgress(state)
      set({ listenedTracks: next, lastStudyDate: today, streakDays: streak, todayCount })
    },
    setLastChapter: (slug) => {
      const state = { ...get(), lastChapter: slug }
      saveProgress(state)
      set({ lastChapter: slug })
    },
    toggleBookmark: (slug) => {
      const cur = get()
      const set_ = new Set(cur.bookmarks)
      if (set_.has(slug)) set_.delete(slug)
      else set_.add(slug)
      const arr = [...set_]
      const state = { ...cur, bookmarks: arr }
      saveProgress(state)
      set({ bookmarks: arr })
    },
  }
})

export type FontSize = 'sm' | 'md' | 'lg'

interface ReaderState {
  fontSize: FontSize
  setFontSize: (s: FontSize) => void
}

function loadReader(): { fontSize: FontSize } {
  try {
    const raw = localStorage.getItem('reader')
    if (raw) {
      const parsed = JSON.parse(raw)
      const fs = parsed.fontSize === 'sm' || parsed.fontSize === 'lg' ? parsed.fontSize : 'md'
      return { fontSize: fs }
    }
  } catch { /* ignore */ }
  return { fontSize: 'md' }
}

export const useReaderStore = create<ReaderState>((set) => ({
  ...loadReader(),
  setFontSize: (fontSize) => {
    localStorage.setItem('reader', JSON.stringify({ fontSize }))
    set({ fontSize })
  },
}))
