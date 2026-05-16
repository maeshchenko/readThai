import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTone } from '@/lib/tone'
import { Icon } from '@/components/ui/Icon'

export interface MCItem {
  glyph: string
  correct: string
  distractors: string[]
}

interface Props {
  items: MCItem[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function MultiChoice({ items }: Props) {
  const { i18n } = useTranslation()
  const ru = i18n.language === 'ru'
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const tone = useTone()
  const q = items[i % items.length]

  const choices = useMemo(() => {
    const pool = [q.correct, ...q.distractors.slice(0, 3)]
    while (pool.length < 4) pool.push('—')
    return shuffle(pool)
  }, [q])

  const pick = (c: string) => {
    if (picked) return
    setPicked(c)
    if (c === q.correct) {
      setScore((s) => s + 1)
      tone(440, 0.16)
      setTimeout(() => tone(660, 0.18), 120)
    } else {
      tone(180, 0.22)
    }
    setTimeout(() => { setPicked(null); setI((n) => n + 1) }, 1100)
  }

  const reset = () => { setI(0); setPicked(null); setScore(0) }

  return (
    <div>
      <div className="mc-q">
        <div className="prompt">{ru ? 'какой звук издаёт эта буква?' : 'what sound does this letter make?'}</div>
        <div className="glyph">{q.glyph}</div>
        <button type="button" className="audio-inline" onClick={() => tone(280 + i * 15, 0.22)}>
          <Icon name="play" size={11} /> {ru ? 'прослушать' : 'listen'}
        </button>
      </div>
      <div className="choices">
        {choices.map((c, idx) => {
          let cls = ''
          if (picked) {
            if (c === q.correct) cls = 'correct'
            else if (c === picked) cls = 'wrong'
          }
          return (
            <button
              key={c + idx}
              type="button"
              className={`choice ${cls}`}
              onClick={() => pick(c)}
              disabled={!!picked}
            >
              <span className="k">{String.fromCharCode(65 + idx)}</span>
              {c}
            </button>
          )
        })}
      </div>
      <div className="deck-controls" style={{ marginTop: 16 }}>
        <div className="deck-counter">
          {ru ? 'вопрос' : 'question'} <b>{i + 1}</b> · {ru ? 'правильно' : 'correct'} <b>{score}</b>
        </div>
        <button type="button" className="pill-btn" onClick={reset}>
          <Icon name="refresh" size={12} /> {ru ? 'заново' : 'reset'}
        </button>
      </div>
    </div>
  )
}
