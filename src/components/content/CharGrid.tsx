import { useState } from 'react'
import { useTone } from '@/lib/tone'

export interface CharItem {
  glyph: string
  ipa?: string
  name?: string
  ru?: string
}

interface Props {
  items: CharItem[]
  columns?: number
  trackNumber?: number
  chapterSlug?: string
  chapterTitle?: string
}

export function CharGrid({ items, columns = 6 }: Props) {
  const [playing, setPlaying] = useState<number | null>(null)
  const tone = useTone()
  const onClick = (i: number) => {
    setPlaying(i)
    setTimeout(() => setPlaying(null), 1100)
    tone(220 + i * 30, 0.18)
  }
  return (
    <div className="char-grid" style={{ '--cols': columns } as React.CSSProperties}>
      {items.map((c, i) => (
        <button
          key={i}
          type="button"
          className={`ch ${playing === i ? 'playing' : ''}`}
          onClick={() => onClick(i)}
        >
          <span className="pin">{(i + 1).toString().padStart(2, '0')}</span>
          <span className="glyph">{c.glyph}</span>
          {c.ipa && <span className="ipa">[{c.ipa}]</span>}
          {c.name && <span className="name">{c.name}</span>}
          <span className="pulse" />
        </button>
      ))}
    </div>
  )
}
