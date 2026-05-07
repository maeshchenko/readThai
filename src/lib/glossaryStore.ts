import { create } from 'zustand'

interface GlossaryState {
  favourites: string[]
  recent: string[]
  toggleFavourite: (key: string) => void
  pushRecent: (key: string) => void
  isFavourite: (key: string) => boolean
}

const KEY = 'glossaryPrefs'
const RECENT_LIMIT = 30

interface Persisted {
  favourites?: string[]
  recent?: string[]
}

function load(): { favourites: string[]; recent: string[] } {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed: Persisted = JSON.parse(raw)
      return { favourites: parsed.favourites ?? [], recent: parsed.recent ?? [] }
    }
  } catch { /* ignore */ }
  return { favourites: [], recent: [] }
}

function save(state: { favourites: string[]; recent: string[] }) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

export const useGlossary = create<GlossaryState>((set, get) => {
  const initial = load()
  return {
    ...initial,
    toggleFavourite: (key) => {
      const set_ = new Set(get().favourites)
      if (set_.has(key)) set_.delete(key)
      else set_.add(key)
      const next = { favourites: [...set_], recent: get().recent }
      save(next)
      set(next)
    },
    pushRecent: (key) => {
      const filtered = get().recent.filter((k) => k !== key)
      filtered.unshift(key)
      const recent = filtered.slice(0, RECENT_LIMIT)
      const next = { favourites: get().favourites, recent }
      save(next)
      set({ recent })
    },
    isFavourite: (key) => get().favourites.includes(key),
  }
})
