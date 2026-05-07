import { motion } from 'framer-motion'
import { ThaiText } from './ThaiText'
import { cn } from '@/lib/cn'
import type { ExampleItem, ExamplesLayout } from '@/lib/contentTypes'

interface Props {
  items: ExampleItem[]
  layout?: ExamplesLayout
  eyebrow?: string
  lang?: 'en' | 'ru'
}

export function ExampleGroup({ items, layout = 'chips', eyebrow, lang = 'en' }: Props) {
  if (!items.length) return null
  const hasMeta = items.some((it) => it.translit || it.meaning)
  const resolved: ExamplesLayout = layout === 'grid' || (layout === 'chips' && hasMeta) ? 'grid' : layout

  return (
    <div className="space-y-3">
      {eyebrow && (
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-on-surface-faint)]">
          {eyebrow}
        </div>
      )}
      {resolved === 'inline' ? (
        <InlineLayout items={items} />
      ) : resolved === 'grid' ? (
        <GridLayout items={items} lang={lang} />
      ) : (
        <ChipsLayout items={items} />
      )}
    </div>
  )
}

function ChipsLayout({ items }: { items: ExampleItem[] }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((item, i) => (
        <motion.div
          key={`${item.thai}-${i}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
          className={cn(
            'group relative rounded-2xl px-4 py-2.5',
            'bg-[var(--color-surface-elevated)]',
            'ring-1 ring-[var(--color-hairline)]',
            'shadow-[var(--shadow-soft)]',
            'transition-all duration-200',
            'hover:-translate-y-[2px] hover:shadow-[var(--shadow-elev)]',
          )}
        >
          <ThaiText size="md" className="leading-tight">{item.thai}</ThaiText>
          {item.translit && (
            <div className="translit mt-0.5 text-xs">{item.translit}</div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

function GridLayout({ items, lang = 'en' }: { items: ExampleItem[]; lang?: 'en' | 'ru' }) {
  const ru = lang === 'ru'
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => {
        const meaning = (ru && item.meaningRu) || item.meaning
        const note = (ru && item.noteRu) || item.note
        return (
          <motion.div
            key={`${item.thai}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
            className={cn(
              'rounded-2xl px-4 py-3',
              'bg-[var(--color-surface-elevated)]',
              'ring-1 ring-[var(--color-hairline)]',
              'shadow-[var(--shadow-soft)]',
              'transition-all duration-200',
              'hover:-translate-y-[2px] hover:shadow-[var(--shadow-elev)]',
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <ThaiText size="md">{item.thai}</ThaiText>
              {item.tone && (
                <span className="rounded-md bg-[var(--color-primary-600)]/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-primary-600)]">
                  {item.tone}
                </span>
              )}
            </div>
            {(item.translit || meaning) && (
              <div className="mt-1.5 space-y-0.5">
                {item.translit && <div className="translit text-xs">{item.translit}</div>}
                {meaning && (
                  <div className="text-xs text-[var(--color-on-surface-muted)]">{meaning}</div>
                )}
              </div>
            )}
            {note && (
              <div className="mt-2 text-[11px] italic text-[var(--color-on-surface-faint)]">{note}</div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

function InlineLayout({ items }: { items: ExampleItem[] }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 text-[var(--color-on-surface)]">
      {items.map((item, i) => (
        <span key={`${item.thai}-${i}`} className="inline-flex items-baseline gap-1.5">
          <ThaiText size="md">{item.thai}</ThaiText>
          {item.translit && <span className="translit text-xs">{item.translit}</span>}
        </span>
      ))}
    </div>
  )
}
