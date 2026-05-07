import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrackCard } from '@/components/audio/TrackCard'
import { ThaiText } from './ThaiText'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  instruction: string
  items: string[]
  trackNumber?: number
  answerKey?: string
}

export function ExerciseBlock({ instruction, items, trackNumber, answerKey }: Props) {
  const { t } = useTranslation()
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div className="rounded-xl border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] p-5 dark:border-[var(--color-primary-900)] dark:bg-[var(--color-primary-900)]/20">
      <p className="mb-3 font-medium">{instruction}</p>

      {trackNumber != null && (
        <div className="mb-4">
          <TrackCard trackNumber={trackNumber} />
        </div>
      )}

      {items.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {items.map((item, i) => (
            <span key={i} className="rounded-lg bg-white/80 px-3 py-1.5 dark:bg-white/10">
              <ThaiText size="md">{item}</ThaiText>
            </span>
          ))}
        </div>
      )}

      {answerKey && (
        <div className="mt-3">
          <button
            onClick={() => setShowAnswer((v) => !v)}
            className="btn btn-ghost text-sm"
          >
            {showAnswer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAnswer ? t('chapter.hideAnswer') : t('chapter.showAnswer')}
          </button>
          {showAnswer && (
            <div className="mt-2 rounded-lg bg-white/60 p-3 text-sm dark:bg-white/5">
              <p className="translit">{answerKey}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
