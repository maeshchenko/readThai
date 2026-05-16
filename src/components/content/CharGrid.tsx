import { useState } from 'react'
import { useTone } from '@/lib/tone'
import { useAudio, type Track } from '@/lib/audio'

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

function pad3(n: number): string { return n.toString().padStart(3, '0') }

export function CharGrid({ items, columns = 6, trackNumber, chapterSlug, chapterTitle }: Props) {
  const [playing, setPlaying] = useState<number | null>(null)
  const tone = useTone()
  const loadAndPlay = useAudio((s) => s.loadAndPlay)

  const onClick = (i: number) => {
    setPlaying(i)
    setTimeout(() => setPlaying(null), 1100)
    if (trackNumber != null) {
      const track: Track = {
        id: `track-${trackNumber}`,
        number: trackNumber,
        src: `${import.meta.env.BASE_URL}audio/${pad3(trackNumber)}.mp3`,
        label: chapterTitle ? `${chapterTitle} · ${trackNumber}` : `Track ${trackNumber}`,
        chapterSlug,
        chapterTitle,
      }
      void loadAndPlay(track)
    } else {
      tone(220 + i * 30, 0.18)
    }
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
