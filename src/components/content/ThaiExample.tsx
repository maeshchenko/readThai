import { ThaiText } from './ThaiText'
import { cn } from '@/lib/cn'

interface Props {
  thai: string
  translit: string
  meaning?: string
  tone?: string
}

const SENTENCE_HINT = /^[A-ZА-Я].{20,}$/
const FOUR_PLUS_WORDS = /^\S+(?:\s+\S+){3,}/

function isLikelyTransliteration(s: string | undefined): boolean {
  if (!s) return false
  const trimmed = s.trim()
  if (!trimmed) return false
  if (SENTENCE_HINT.test(trimmed) && FOUR_PLUS_WORDS.test(trimmed)) return false
  if (/[.!?]\s/.test(trimmed)) return false
  return true
}

export function ThaiExample({ thai, translit, meaning, tone }: Props) {
  const validTranslit = isLikelyTransliteration(translit) ? translit : ''
  const showCard = !!validTranslit || !!meaning

  if (!showCard) {
    return (
      <div className="inline-flex">
        <span
          className={cn(
            'rounded-2xl px-4 py-2.5',
            'bg-[var(--color-surface-elevated)]',
            'ring-1 ring-[var(--color-hairline)]',
            'shadow-[var(--shadow-soft)]',
          )}
        >
          <ThaiText size="md">{thai}</ThaiText>
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-5 rounded-2xl px-5 py-4',
        'bg-[var(--color-surface-elevated)]',
        'ring-1 ring-[var(--color-hairline)]',
        'shadow-[var(--shadow-soft)]',
        'transition-shadow duration-200',
        'hover:shadow-[var(--shadow-elev)]',
      )}
    >
      <ThaiText size="xl">{thai}</ThaiText>
      <div className="min-w-0 pt-1.5">
        <div className="flex items-baseline gap-2">
          {validTranslit && <span className="translit">{validTranslit}</span>}
          {tone && (
            <span className="rounded-md bg-[var(--color-primary-600)]/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-primary-600)]">
              {tone}
            </span>
          )}
        </div>
        {meaning && (
          <div className="mt-1 text-sm text-[var(--color-on-surface-muted)]">{meaning}</div>
        )}
      </div>
    </div>
  )
}
