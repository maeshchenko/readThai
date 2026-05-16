import { useState } from 'react'
import { useTweaks, PALETTES, type Palette, type ExerciseStyle } from '@/lib/tweaks'

export function TweaksPanel() {
  const [open, setOpen] = useState(false)
  const palette = useTweaks((s) => s.palette)
  const thaiSize = useTweaks((s) => s.thaiSize)
  const exerciseStyle = useTweaks((s) => s.exerciseStyle)
  const setPalette = useTweaks((s) => s.setPalette)
  const setThaiSize = useTweaks((s) => s.setThaiSize)
  const setExerciseStyle = useTweaks((s) => s.setExerciseStyle)

  return (
    <div className={`tweaks-panel ${open ? '' : 'collapsed'}`}>
      <button
        type="button"
        className="tweaks-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="tweaks-title">— Tweaks</span>
        <span className="tweaks-title" style={{ marginLeft: 12 }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="tweaks-body">
          <TweakSection label="Палитра">
            <div className="palette-row">
              {(Object.keys(PALETTES) as Palette[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`pal ${palette === k ? 'active' : ''}`}
                  style={{ background: PALETTES[k].accent }}
                  onClick={() => setPalette(k)}
                  title={PALETTES[k].label}
                  aria-label={PALETTES[k].label}
                />
              ))}
            </div>
          </TweakSection>
          <TweakSection label="Тайские символы">
            <div className="tweak-slider">
              <input
                type="range"
                min={70}
                max={140}
                step={5}
                value={Math.round(thaiSize * 100)}
                onChange={(e) => setThaiSize(Number(e.target.value) / 100)}
              />
              <span className="val">{Math.round(thaiSize * 100)}%</span>
            </div>
          </TweakSection>
          <TweakSection label="Тренировка">
            <div className="tweak-radio">
              {(['flashcards', 'multichoice'] as ExerciseStyle[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={exerciseStyle === k ? 'active' : ''}
                  onClick={() => setExerciseStyle(k)}
                >
                  {k === 'flashcards' ? 'карточки' : 'выбор'}
                </button>
              ))}
            </div>
          </TweakSection>
        </div>
      )}
    </div>
  )
}

function TweakSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="tweak-section">
      <div className="label">{label}</div>
      {children}
    </div>
  )
}
