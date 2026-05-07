import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search, CheckCircle2 } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { chapters } from '@/lib/chapters'
import { useProgressStore } from '@/lib/stores'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/haptic'

interface Group {
  id: string
  labelEn: string
  labelRu: string
  ids: string[]
}

const GROUPS: Group[] = [
  {
    id: 'intro',
    labelEn: 'Getting Started',
    labelRu: 'Начало',
    ids: ['preface', 'introduction', 'pronunciation'],
  },
  {
    id: 'lessons',
    labelEn: 'Lessons',
    labelRu: 'Уроки',
    ids: ['day-1', 'day-2', 'day-3', 'day-4', 'day-5', 'intermission', 'day-6', 'day-7', 'day-8', 'day-9', 'preliminary', 'last-day'],
  },
  {
    id: 'reference',
    labelEn: 'Reference',
    labelRu: 'Справочник',
    ids: ['appendix-i', 'appendix-ii', 'appendix-iii', 'appendix-iv', 'appendix-v', 'glossary'],
  },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function LessonsSheet({ open, onClose }: Props) {
  const { i18n, t } = useTranslation()
  const lang = i18n.language as 'en' | 'ru'
  const navigate = useNavigate()
  const { listenedTracks } = useProgressStore()
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return GROUPS.map((g) => {
      const items = g.ids
        .map((id) => chapters.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .filter((c) => {
          if (!q) return true
          return (
            c.titleEn.toLowerCase().includes(q) ||
            c.titleRu.toLowerCase().includes(q) ||
            c.slug.toLowerCase().includes(q)
          )
        })
      return { ...g, items }
    }).filter((g) => g.items.length > 0)
  }, [query])

  const goto = (slug: string) => {
    haptic('selection')
    navigate(`/${slug}`)
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      size="full"
      title={t('nav.tableOfContents')}
      ariaLabel={t('nav.tableOfContents')}
    >
      <div className="sticky top-0 z-10 -mx-5 mb-3 bg-[var(--color-surface-elevated)] px-5 pb-3 pt-1">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'ru' ? 'Поиск глав…' : 'Search chapters…'}
            inputMode="search"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface-dim)] py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[var(--color-primary-500)] focus:bg-[var(--color-surface-bright)]"
          />
        </div>
      </div>

      <div className="space-y-6 pb-2">
        {groups.length === 0 && (
          <p className="py-12 text-center text-sm text-[var(--color-on-surface-muted)]">
            {lang === 'ru' ? 'Ничего не найдено' : 'No matches'}
          </p>
        )}
        {groups.map((g) => (
          <section key={g.id}>
            <h3 className="eyebrow sticky top-[60px] z-[5] mb-2 bg-[var(--color-surface-elevated)] py-1.5">
              {lang === 'ru' ? g.labelRu : g.labelEn}
            </h3>
            <ul className="space-y-1">
              {g.items.map((ch) => {
                const title = lang === 'ru' ? ch.titleRu : ch.titleEn
                const total = ch.tracks.length
                const listened = ch.tracks.filter((t) => listenedTracks.has(t)).length
                const pct = total > 0 ? (listened / total) * 100 : 0
                const allDone = total > 0 && listened === total
                return (
                  <li key={ch.id}>
                    <button
                      onClick={() => goto(ch.slug)}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[var(--color-surface-dim)] active:bg-[var(--color-surface-dim)]"
                    >
                      <ProgressDot pct={pct} done={allDone} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-medium tracking-tight">{title}</div>
                        {total > 0 && (
                          <div className="mt-0.5 text-[11px] tabular-nums text-[var(--color-on-surface-muted)]">
                            {listened}/{total} · {Math.round(pct)}%
                          </div>
                        )}
                      </div>
                      {allDone && <CheckCircle2 size={16} className="shrink-0 text-[var(--color-accent-500)]" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </BottomSheet>
  )
}

function ProgressDot({ pct, done }: { pct: number; done: boolean }) {
  const size = 22
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.max(0, Math.min(100, pct)) / 100) * c
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
        done ? 'bg-[var(--color-accent-500)]/12' : 'bg-[var(--color-surface-dim)]',
      )}
    >
      {pct > 0 ? (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-hairline)"
            strokeWidth="2"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={done ? 'var(--color-accent-500)' : 'var(--color-primary-500)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-on-surface-faint)]/50" />
      )}
    </div>
  )
}
