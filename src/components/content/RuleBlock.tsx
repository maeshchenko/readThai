import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'

interface Props {
  html: string
  emphasis?: 'soft' | 'strong'
  eyebrow?: string
}

export function RuleBlock({ html, emphasis = 'soft', eyebrow }: Props) {
  const { t } = useTranslation()
  const label = eyebrow ?? t('chapter.ruleEyebrow', { defaultValue: 'Rule' })

  if (emphasis === 'strong') {
    return (
      <div
        className={cn(
          'rounded-2xl px-5 py-4',
          'bg-[var(--color-surface-elevated)]',
          'ring-1 ring-[var(--color-hairline)]',
          'shadow-[var(--shadow-soft)]',
          'border-l-[3px] border-[var(--color-primary-500)]',
        )}
      >
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary-600)]">
          {label}
        </div>
        <div
          className="leading-relaxed text-[var(--color-on-surface)]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    )
  }

  return (
    <div className="border-l-[3px] border-[var(--color-primary-400)]/70 pl-4">
      <div
        className="leading-relaxed text-[var(--color-on-surface)]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
