import { useState } from 'react'
import { useTone } from '@/lib/tone'

export interface SylItem {
  glyph: string
  ipa?: string
  ru?: string
  meaning?: string
}

interface Props {
  items: SylItem[]
}

export function SyllableTryIt({ items }: Props) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const tone = useTone()
  return (
    <div className="syl-grid">
      {items.map((s, i) => {
        const r = revealed.has(i)
        return (
          <button
            key={i}
            type="button"
            className={`syl ${r ? 'revealed' : ''}`}
            onClick={() => {
              tone(280 + i * 20, 0.22)
              setRevealed((prev) => {
                const n = new Set(prev)
                if (n.has(i)) n.delete(i)
                else n.add(i)
                return n
              })
            }}
          >
            <span className="reveal-cue">{r ? '✓' : 'tap'}</span>
            <span className="glyph">{s.glyph}</span>
            {s.ipa && <span className="ipa">/{s.ipa}/</span>}
            <span className="ru">{s.ru || s.meaning || '—'}</span>
          </button>
        )
      })}
    </div>
  )
}
