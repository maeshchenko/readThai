import { Info, AlertTriangle, Lightbulb } from 'lucide-react'

interface Props {
  variant: 'tip' | 'warning' | 'note'
  html: string
}

const config = {
  tip: {
    icon: Lightbulb,
    border: 'border-[var(--color-accent-300)] dark:border-[var(--color-accent-800)]',
    bg: 'bg-[var(--color-accent-50)] dark:bg-[var(--color-accent-900)]/20',
    iconColor: 'text-[var(--color-accent-600)]',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-300 dark:border-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600',
  },
  note: {
    icon: Info,
    border: 'border-[var(--color-primary-300)] dark:border-[var(--color-primary-800)]',
    bg: 'bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/20',
    iconColor: 'text-[var(--color-primary-600)]',
  },
}

export function CalloutBlock({ variant, html }: Props) {
  const { icon: Icon, border, bg, iconColor } = config[variant]

  return (
    <div className={`flex gap-3 rounded-xl border ${border} ${bg} p-4`}>
      <Icon size={18} className={`mt-0.5 shrink-0 ${iconColor}`} />
      <div className="min-w-0 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
