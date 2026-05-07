import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { ThaiText } from '@/components/content/ThaiText'
import { motion } from 'framer-motion'

interface GlossaryEntry {
  thai: string
  translit: string
  meaning: string
}

export function GlossaryPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<GlossaryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    import('../content/glossary.json')
      .then((mod) => {
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
                })
              }
            }
          }
        }
        setEntries(rows)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return entries
    const q = query.toLowerCase().trim()
    return entries.filter(
      (e) =>
        e.thai.includes(q) ||
        e.translit.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q),
    )
  }, [entries, query])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-3xl"
    >
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        {t('nav.glossary')}
      </h1>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('glossary.search')}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-bright)] py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20"
        />
      </div>

      <p className="mb-4 text-sm text-[var(--color-on-surface-muted)]">
        {t('glossary.entries', { count: filtered.length })}
      </p>

      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-[var(--color-surface-dim)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-[var(--color-on-surface-muted)]">
          {t('glossary.noResults')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-dim)]">
                <th className="px-4 py-3 text-sm font-semibold">Thai</th>
                <th className="px-4 py-3 text-sm font-semibold">Transliteration</th>
                <th className="px-4 py-3 text-sm font-semibold">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((entry, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-dim)] transition-colors">
                  <td className="px-4 py-2.5">
                    <ThaiText size="sm">{entry.thai}</ThaiText>
                  </td>
                  <td className="translit px-4 py-2.5">{entry.translit}</td>
                  <td className="px-4 py-2.5 text-sm text-[var(--color-on-surface-muted)]">{entry.meaning}</td>
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
    </motion.div>
  )
}
