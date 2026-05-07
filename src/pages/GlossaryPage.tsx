import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { ThaiText } from '@/components/content/ThaiText'
import { Skeleton } from '@/components/ui/Skeleton'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useDebounce } from '@/hooks/useDebounce'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useGlossary } from '@/lib/glossaryStore'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/haptic'

interface GlossaryEntry {
  thai: string
  translit: string
  meaning: string
  meaningRu?: string
  key: string
}

type Filter = 'all' | 'recent' | 'favourites'

export function GlossaryPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'en' | 'ru'
  const isMobile = useIsMobile()
  const { favourites, recent, toggleFavourite, pushRecent, isFavourite } = useGlossary()

  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 80)
  const [filter, setFilter] = useState<Filter>('all')
  const [entries, setEntries] = useState<GlossaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<GlossaryEntry | null>(null)
  const [visibleCount, setVisibleCount] = useState(80)

  const listRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    import('../content/glossary.json')
      .then((mod) => {
        if (cancelled) return
        const data = mod.default
        const rows: GlossaryEntry[] = []
        for (const block of data.blocks) {
          if (block.type === 'thaiTable' && block.rows) {
            for (const row of block.rows) {
              if (row.thai) {
                rows.push({
                  thai: row.thai,
                  translit: row.translit || '',
                  meaning: row.meaning || '',
                  meaningRu: row.meaningRu || '',
                  key: `${row.thai}|${row.translit ?? ''}`,
                })
              }
            }
          }
        }
        setEntries(rows)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    let list = entries
    if (filter === 'favourites') {
      const fav = new Set(favourites)
      list = list.filter((e) => fav.has(e.key))
    } else if (filter === 'recent') {
      const order = new Map(recent.map((k, i) => [k, i]))
      list = list.filter((e) => order.has(e.key)).sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0))
    }
    const q = debounced.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (e) =>
        e.thai.includes(q) ||
        e.translit.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        (e.meaningRu && e.meaningRu.toLowerCase().includes(q)),
    )
  }, [entries, debounced, filter, favourites, recent])

  // Reset visible count on query change
  useEffect(() => {
    setVisibleCount(80)
  }, [debounced, filter])

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + 80, filtered.length))
        }
      },
      { rootMargin: '400px' },
    )
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [filtered.length])

  const onTapEntry = (entry: GlossaryEntry) => {
    haptic('selection')
    pushRecent(entry.key)
    setDetail(entry)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-3xl"
    >
      <h1 className="mb-3 text-[26px] font-bold leading-[1.15] tracking-tight md:mb-6 md:text-3xl md:leading-tight">
        {t('nav.glossary')}
      </h1>

      <div className="sticky top-[var(--mobile-header-h)] z-10 -mx-4 mb-3 bg-[var(--color-surface)]/85 px-4 py-2 backdrop-blur-xl md:relative md:top-0 md:-mx-0 md:bg-transparent md:p-0 md:backdrop-blur-0">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('glossary.search')}
            inputMode="search"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface-elevated)] py-3 pl-10 pr-10 text-sm outline-none transition-colors focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20"
          />
          {query && (
            <button
              onClick={() => { haptic('selection'); setQuery('') }}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-surface-dim)] text-[var(--color-on-surface-muted)] active:bg-[var(--color-surface-bright)]"
              aria-label="Clear"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label={t('glossary.filterAll')} />
          {recent.length > 0 && (
            <FilterChip active={filter === 'recent'} onClick={() => setFilter('recent')} label={t('glossary.filterRecent')} count={recent.length} />
          )}
          {favourites.length > 0 && (
            <FilterChip active={filter === 'favourites'} onClick={() => setFilter('favourites')} label={t('glossary.filterFavourites')} count={favourites.length} />
          )}
          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[var(--color-on-surface-muted)]">
            {t('glossary.entries', { count: filtered.length })}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} height={64} rounded="lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-dim)]">
            <Search size={20} className="text-[var(--color-on-surface-muted)]" />
          </div>
          <p className="text-sm text-[var(--color-on-surface-muted)]">{t('glossary.noResults')}</p>
        </div>
      ) : isMobile ? (
        <div ref={listRef} className="space-y-2">
          {filtered.slice(0, visibleCount).map((entry) => (
            <EntryCard
              key={entry.key}
              entry={entry}
              query={debounced}
              onTap={onTapEntry}
              favourite={isFavourite(entry.key)}
              onToggleFav={(k) => { haptic('selection'); toggleFavourite(k) }}
              lang={lang}
            />
          ))}
          {visibleCount < filtered.length && (
            <div ref={sentinelRef} className="py-6 text-center text-xs text-[var(--color-on-surface-muted)]">
              {lang === 'ru' ? 'Загрузка…' : 'Loading more…'}
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-dim)]">
                <th className="px-4 py-3 text-sm font-semibold">{lang === 'ru' ? 'Тайский' : 'Thai'}</th>
                <th className="px-4 py-3 text-sm font-semibold">{lang === 'ru' ? 'Транслитерация' : 'Transliteration'}</th>
                <th className="px-4 py-3 text-sm font-semibold">{lang === 'ru' ? 'Значение' : 'Meaning'}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((entry) => (
                <tr
                  key={entry.key}
                  onClick={() => onTapEntry(entry)}
                  className="cursor-pointer border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-surface-dim)]"
                >
                  <td className="px-4 py-2.5">
                    <Highlight text={entry.thai} query={debounced} as="thai" />
                  </td>
                  <td className="translit px-4 py-2.5">
                    <Highlight text={entry.translit} query={debounced} />
                  </td>
                  <td className="px-4 py-2.5 text-sm text-[var(--color-on-surface-muted)]">
                    <Highlight text={(lang === 'ru' && entry.meaningRu) || entry.meaning} query={debounced} />
                  </td>
                  <td className="pr-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavourite(entry.key) }}
                      className="rounded p-1 text-[var(--color-on-surface-faint)] hover:text-amber-500"
                      aria-label="Favourite"
                    >
                      <Star size={14} fill={isFavourite(entry.key) ? 'currentColor' : 'none'} className={cn(isFavourite(entry.key) && 'text-amber-500')} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <p className="border-t border-[var(--color-border)] bg-[var(--color-surface-dim)] px-4 py-2 text-center text-xs text-[var(--color-on-surface-muted)]">
              Showing 200 of {filtered.length} results. Refine your search to see more.
            </p>
          )}
        </div>
      )}

      <BottomSheet
        open={detail != null}
        onClose={() => setDetail(null)}
        size="auto"
        title={detail?.translit || detail?.thai}
        ariaLabel="Word details"
      >
        {detail && (
          <div className="space-y-4 pb-4">
            <div className="rounded-2xl bg-[var(--color-surface-dim)] p-5 text-center">
              <ThaiText size="xl">{detail.thai}</ThaiText>
              {detail.translit && (
                <div className="translit mt-2 text-sm">{detail.translit}</div>
              )}
            </div>
            {detail.meaning && (
              <div>
                <div className="eyebrow mb-1.5">{lang === 'ru' ? 'Перевод' : 'Meaning'}</div>
                <p className="text-[15px] leading-relaxed text-[var(--color-on-surface)]">{(lang === 'ru' && detail.meaningRu) || detail.meaning}</p>
              </div>
            )}
            <div className="pt-2">
              <button
                onClick={() => {
                  if (!detail) return
                  haptic('selection')
                  toggleFavourite(detail.key)
                }}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium ring-1 ring-[var(--color-hairline)] transition-all active:scale-[0.98]',
                  isFavourite(detail.key)
                    ? 'bg-amber-500/12 text-amber-600 dark:text-amber-400'
                    : 'bg-[var(--color-surface-dim)] text-[var(--color-on-surface)]',
                )}
              >
                <Star size={15} fill={isFavourite(detail.key) ? 'currentColor' : 'none'} />
                {isFavourite(detail.key)
                  ? lang === 'ru' ? 'В избранном' : 'Favourited'
                  : t('glossary.favourite')}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </motion.div>
  )
}

function EntryCard({
  entry,
  query,
  onTap,
  favourite,
  onToggleFav,
  lang = 'en',
}: {
  entry: GlossaryEntry
  query: string
  onTap: (e: GlossaryEntry) => void
  favourite: boolean
  onToggleFav: (key: string) => void
  lang?: 'en' | 'ru'
}) {
  const meaning = (lang === 'ru' && entry.meaningRu) || entry.meaning
  return (
    <button
      onClick={() => onTap(entry)}
      className="group flex w-full items-start gap-3 rounded-2xl bg-[var(--color-surface-elevated)] px-4 py-3 text-left ring-1 ring-[var(--color-hairline)] transition-all active:scale-[0.99] active:bg-[var(--color-surface-dim)]"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-0.5">
          <Highlight text={entry.thai} query={query} as="thai" />
        </div>
        {entry.translit && (
          <div className="translit text-[13px]">
            <Highlight text={entry.translit} query={query} />
          </div>
        )}
        {meaning && (
          <div className="mt-1 line-clamp-2 text-[13px] text-[var(--color-on-surface-muted)]">
            <Highlight text={meaning} query={query} />
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFav(entry.key)
        }}
        className={cn(
          'shrink-0 rounded-full p-1.5 text-[var(--color-on-surface-faint)] transition-colors',
          favourite && 'text-amber-500',
        )}
        aria-label="Favourite"
      >
        <Star size={16} fill={favourite ? 'currentColor' : 'none'} />
      </button>
    </button>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count?: number
}) {
  return (
    <button
      onClick={() => { haptic('selection'); onClick() }}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all active:scale-[0.96]',
        active
          ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
          : 'bg-[var(--color-surface-dim)] text-[var(--color-on-surface)] ring-1 ring-[var(--color-hairline)]',
      )}
    >
      {label}
      {count != null && (
        <span className={cn('rounded-full px-1.5 py-0 text-[10px] tabular-nums', active ? 'bg-white/20' : 'bg-[var(--color-surface-bright)] text-[var(--color-on-surface-muted)]')}>
          {count}
        </span>
      )}
    </button>
  )
}

function Highlight({ text, query, as }: { text: string; query: string; as?: 'thai' }) {
  if (!query) {
    if (as === 'thai') return <ThaiText size="md">{text}</ThaiText>
    return <>{text}</>
  }
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) {
    if (as === 'thai') return <ThaiText size="md">{text}</ThaiText>
    return <>{text}</>
  }
  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + query.length)
  const after = text.slice(idx + query.length)
  if (as === 'thai') {
    return (
      <ThaiHighlight before={before} match={match} after={after} />
    )
  }
  return (
    <>
      {before}
      <mark className="rounded bg-[var(--color-primary-500)]/20 px-0.5 text-inherit">{match}</mark>
      {after}
    </>
  )
}

function ThaiHighlight({ before, match, after }: { before: string; match: string; after: string }) {
  return (
    <span className="thai-text text-[1.5rem] leading-relaxed">
      {before}
      <mark className="rounded bg-[var(--color-primary-500)]/20 px-0.5 text-[var(--color-on-surface)]">{match}</mark>
      {after}
    </span>
  )
}
