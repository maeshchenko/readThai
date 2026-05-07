import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'

interface Props {
  html: string
}

export function PreviewBlock({ html }: Props) {
  const { t } = useTranslation()

  return (
    <div className="relative mt-10 overflow-hidden rounded-2xl bg-[var(--color-surface-dim)] p-5 ring-1 ring-[var(--color-hairline)]">
      <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-on-surface-muted)]">
        <ChevronRight size={12} className="text-[var(--color-primary-500)]" />
        {t('chapter.tomorrowPreview')}
      </div>
      <div
        className="text-sm leading-relaxed text-[var(--color-on-surface-muted)]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
