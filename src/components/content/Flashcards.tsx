import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTone } from '@/lib/tone'
import { Icon } from '@/components/ui/Icon'

export interface DeckItem {
  glyph: string
  ipa?: string
  name?: string
  ru?: string
}

type Mark = 'again' | 'hard' | 'good' | 'easy'

interface Props {
  items: DeckItem[]
}

export function Flashcards({ items }: Props) {
  const { i18n } = useTranslation()
  const ru = i18n.language === 'ru'
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [, setMarks] = useState<Record<number, Mark>>({})
  const tone = useTone()
  const c = items[i] ?? items[0]

  const next = () => { setFlipped(false); setI((x) => (x + 1) % items.length) }
  const prev = () => { setFlipped(false); setI((x) => (x - 1 + items.length) % items.length) }
  const judge = (k: Mark) => {
    setMarks((m) => ({ ...m, [i]: k }))
    setTimeout(next, 200)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f) }
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (['1', '2', '3', '4'].includes(e.key)) {
        judge((['again', 'hard', 'good', 'easy'] as Mark[])[Number(e.key) - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const labels: Record<Mark, [string, string]> = ru
    ? { again: ['снова', '1'], hard: ['сложно', '2'], good: ['хорошо', '3'], easy: ['легко', '4'] }
    : { again: ['again', '1'], hard: ['hard', '2'], good: ['good', '3'], easy: ['easy', '4'] }

  return (
    <div>
      <div className="deck-stage-card" onClick={() => setFlipped((f) => !f)}>
        <div className={`card-3d ${flipped ? 'flipped' : ''}`}>
          <div className="card-face">
            <div className="pos">{String(i + 1).padStart(2, '0')} · {String(items.length).padStart(2, '0')}</div>
            <button
              type="button"
              className="audio-mini"
              onClick={(e) => { e.stopPropagation(); tone(240 + i * 40, 0.22) }}
              aria-label="Play"
            >
              <Icon name="play" size={11} />
            </button>
            <div className="glyph">{c.glyph}</div>
            <div className="hint">{ru ? 'tap / space — перевернуть' : 'tap / space — flip'}</div>
          </div>
          <div className="card-face back">
            <div className="pos">{ru ? 'ответ' : 'answer'}</div>
            <button
              type="button"
              className="audio-mini"
              onClick={(e) => { e.stopPropagation(); tone(240 + i * 40, 0.22) }}
              aria-label="Play"
            >
              <Icon name="play" size={11} />
            </button>
            <div>
              {c.ipa && <div className="ipa">/{c.ipa}/</div>}
              {c.name && <div className="name">{c.name}</div>}
              {c.ru && <div className="ru">{c.ru}</div>}
            </div>
          </div>
        </div>
      </div>
      <div className="deck-controls">
        <div className="group">
          <button type="button" className="pill-btn" onClick={prev}>
            <Icon name="arrowL" size={12} /> {ru ? 'назад' : 'back'}
          </button>
          <button type="button" className="pill-btn" onClick={next}>
            {ru ? 'дальше' : 'next'} <Icon name="arrow" size={12} />
          </button>
        </div>
        <div className="deck-counter">
          {ru ? 'карточка' : 'card'} <b>{i + 1}</b> {ru ? 'из' : 'of'} <b>{items.length}</b>
        </div>
      </div>
      <div className="judge-row">
        {(Object.keys(labels) as Mark[]).map((k) => {
          const [l, key] = labels[k]
          return (
            <button key={k} type="button" className={`judge ${k}`} onClick={() => judge(k)}>
              <span>{l}</span>
              <span className="k">{key}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
