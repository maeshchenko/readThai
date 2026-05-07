import { useTranslation } from 'react-i18next'
import { ListChecks } from 'lucide-react'

interface Props {
  items: string[]
}

export function RecapBlock({ items }: Props) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-[var(--color-accent-200)] bg-[var(--color-accent-50)] p-5 dark:border-[var(--color-accent-900)] dark:bg-[var(--color-accent-900)]/20">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        <ListChecks size={18} className="text-[var(--color-accent-600)]" />
        {t('chapter.todaysRecap')}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="mt-1 shrink-0 text-[var(--color-accent-600)]">✓</span>
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </li>
        ))}
      </ul>
    </div>
  )
}
