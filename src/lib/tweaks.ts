import { create } from 'zustand'
import { useEffect } from 'react'

export type Palette = 'saffron' | 'indigo' | 'jade' | 'ink'
export type ExerciseStyle = 'flashcards' | 'multichoice'

export interface PaletteDef {
  accent: string
  soft: string
  ink: string
  gold: string
  label: string
}

export const PALETTES: Record<Palette, PaletteDef> = {
  saffron: { accent: '#b3492e', soft: '#e9c9b8', ink: '#6b2613', gold: '#c08a3e', label: 'Шафран' },
  indigo:  { accent: '#2f3aa3', soft: '#cdd1ed', ink: '#1c2475', gold: '#9c8252', label: 'Индиго' },
  jade:    { accent: '#2c6e54', soft: '#cae0d2', ink: '#1d4836', gold: '#a8945a', label: 'Нефрит' },
  ink:     { accent: '#1a1814', soft: '#d8cdb6', ink: '#000000', gold: '#8a7a55', label: 'Тушь' },
}

interface TweaksState {
  palette: Palette
  thaiSize: number
  exerciseStyle: ExerciseStyle
  setPalette: (p: Palette) => void
  setThaiSize: (n: number) => void
  setExerciseStyle: (s: ExerciseStyle) => void
}

const KEY = 'tweaks'

interface Persisted {
  palette?: Palette
  thaiSize?: number
  exerciseStyle?: ExerciseStyle
}

function load(): Required<Persisted> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
    if (raw) {
      const p: Persisted = JSON.parse(raw)
      return {
        palette: PALETTES[p.palette as Palette] ? (p.palette as Palette) : 'saffron',
        thaiSize: typeof p.thaiSize === 'number' && p.thaiSize >= 0.7 && p.thaiSize <= 1.4 ? p.thaiSize : 1,
        exerciseStyle: p.exerciseStyle === 'multichoice' ? 'multichoice' : 'flashcards',
      }
    }
  } catch { /* ignore */ }
  return { palette: 'saffron', thaiSize: 1, exerciseStyle: 'flashcards' }
}

function save(state: Required<Persisted>) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

export const useTweaks = create<TweaksState>((set, get) => {
  const initial = load()
  return {
    ...initial,
    setPalette: (palette) => {
      const next = { ...get(), palette }
      save({ palette: next.palette, thaiSize: next.thaiSize, exerciseStyle: next.exerciseStyle })
      set({ palette })
    },
    setThaiSize: (thaiSize) => {
      const next = { ...get(), thaiSize }
      save({ palette: next.palette, thaiSize: next.thaiSize, exerciseStyle: next.exerciseStyle })
      set({ thaiSize })
    },
    setExerciseStyle: (exerciseStyle) => {
      const next = { ...get(), exerciseStyle }
      save({ palette: next.palette, thaiSize: next.thaiSize, exerciseStyle: next.exerciseStyle })
      set({ exerciseStyle })
    },
  }
})

export function useApplyPalette() {
  const palette = useTweaks((s) => s.palette)
  useEffect(() => {
    const p = PALETTES[palette] || PALETTES.saffron
    const root = document.documentElement
    root.style.setProperty('--accent', p.accent)
    root.style.setProperty('--accent-soft', p.soft)
    root.style.setProperty('--accent-ink', p.ink)
    root.style.setProperty('--gold', p.gold)
  }, [palette])
}

export function useApplyThaiSize() {
  const thaiSize = useTweaks((s) => s.thaiSize)
  useEffect(() => {
    const scale = thaiSize
    document.documentElement.style.setProperty('--thai-scale', String(scale))
    let s = document.getElementById('thai-scale-style') as HTMLStyleElement | null
    if (!s) {
      s = document.createElement('style')
      s.id = 'thai-scale-style'
      document.head.appendChild(s)
    }
    s.textContent = `
      @media (min-width: 721px){
        .char-grid .ch .glyph{ font-size: ${56 * scale}px !important; }
        .syl .glyph{ font-size: ${32 * scale}px !important; }
        .card-face .glyph{ font-size: clamp(${120 * scale}px, ${18 * scale}vw, ${220 * scale}px) !important; }
        .mc-q .glyph{ font-size: clamp(${120 * scale}px, ${14 * scale}vw, ${180 * scale}px) !important; }
        .hero-plate .g{ font-size: clamp(${80 * scale}px, ${12 * scale}vw, ${160 * scale}px) !important; }
        .ref-table .glyph-cell{ font-size: ${26 * scale}px !important; }
      }
      @media (max-width: 720px){
        .char-grid .ch .glyph{ font-size: ${Math.round(40 * scale)}px !important; }
        .syl .glyph{ font-size: ${Math.round(26 * scale)}px !important; }
        .card-face .glyph{ font-size: clamp(${Math.round(90 * scale)}px, ${Math.round(30 * scale)}vw, ${Math.round(150 * scale)}px) !important; }
        .mc-q .glyph{ font-size: clamp(${Math.round(90 * scale)}px, ${Math.round(28 * scale)}vw, ${Math.round(140 * scale)}px) !important; }
        .hero-plate .g{ font-size: clamp(${Math.round(54 * scale)}px, ${Math.round(16 * scale)}vw, ${Math.round(100 * scale)}px) !important; }
      }
    `
  }, [thaiSize])
}
