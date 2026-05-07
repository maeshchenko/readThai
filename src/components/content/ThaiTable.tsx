import { useEffect, useRef, useState } from 'react'
import type { ThaiTableRow, TableHeaderRow } from '@/lib/contentTypes'
import { ThaiText } from './ThaiText'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/cn'

interface Props {
  columns: string[]
  rows: ThaiTableRow[]
  headerRows?: TableHeaderRow[]
  stickyFirstCol?: boolean
  lang?: 'en' | 'ru'
}

export function ThaiTable({ columns, rows, headerRows, stickyFirstCol, lang = 'en' }: Props) {
  const isMobile = useIsMobile()

  if (isMobile && (!headerRows || headerRows.length === 0)) {
    return <CardList rows={rows} lang={lang} />
  }

  return (
    <FadeScroller>
      <table className="w-full text-left">
        <thead>
          {headerRows && headerRows.length > 0 ? (
            headerRows.map((row, ri) => (
              <tr
                key={ri}
                className={cn(
                  'border-b border-[var(--color-hairline)] bg-[var(--color-surface-dim)]',
                  ri === headerRows.length - 1 && 'bg-[var(--color-surface-elevated)]',
                )}
              >
                {row.map((cell, ci) => (
                  <th
                    key={ci}
                    colSpan={cell.colSpan}
                    className={cn(
                      'px-4 py-2.5 text-sm font-semibold tracking-tight',
                      cell.align === 'center' && 'text-center',
                      cell.align === 'right' && 'text-right',
                    )}
                  >
                    {cell.text}
                  </th>
                ))}
              </tr>
            ))
          ) : (
            <tr className="border-b border-[var(--color-hairline)] bg-[var(--color-surface-dim)]">
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-2.5 text-sm font-semibold tracking-tight">
                  {col}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={cn(
                'border-b border-[var(--color-hairline)] last:border-0 transition-colors',
                i % 2 === 1 && 'bg-[var(--color-surface-dim)]/40',
                'hover:bg-[var(--color-primary-50)]/40 dark:hover:bg-[var(--color-primary-900)]/20',
              )}
            >
              <td
                className={cn(
                  'px-4 py-2.5',
                  stickyFirstCol && 'sticky left-0 z-10 bg-inherit',
                )}
              >
                <ThaiText size="md">{row.thai}</ThaiText>
              </td>
              {(row.translit || columns.length > 1) && (
                <td className="translit px-4 py-2.5">{(lang === 'ru' && row.translitRu) || row.translit}</td>
              )}
              {rows.some((r) => r.meaning) && (
                <td className="px-4 py-2.5 text-sm text-[var(--color-on-surface-muted)]">
                  {(lang === 'ru' && row.meaningRu) || row.meaning || ''}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </FadeScroller>
  )
}

function CardList({ rows, lang = 'en' }: { rows: ThaiTableRow[]; lang?: 'en' | 'ru' }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--color-surface-elevated)] ring-1 ring-[var(--color-hairline)] shadow-[var(--shadow-soft)]">
      {rows.map((row, i) => {
        const meaning = (lang === 'ru' && row.meaningRu) || row.meaning
        return (
          <div
            key={i}
            className={cn(
              'flex items-start gap-3 px-4 py-3.5',
              i !== 0 && 'border-t border-[var(--color-hairline)]',
            )}
          >
            <div className="min-w-0 flex-1">
              <ThaiText size="md">{row.thai}</ThaiText>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                {row.translit && <span className="translit text-[12px]">{(lang === 'ru' && row.translitRu) || row.translit}</span>}
                {meaning && (
                  <span className="text-[12px] text-[var(--color-on-surface-muted)]">
                    {meaning}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FadeScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState<{ left: boolean; right: boolean }>({ left: false, right: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const left = el.scrollLeft > 4
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
      setEdge({ left, right })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="relative">
      <div
        ref={ref}
        className="overflow-x-auto rounded-2xl ring-1 ring-[var(--color-hairline)] shadow-[var(--shadow-soft)]"
      >
        {children}
      </div>
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-2xl bg-gradient-to-r from-[var(--color-surface-elevated)] to-transparent transition-opacity',
          edge.left ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-2xl bg-gradient-to-l from-[var(--color-surface-elevated)] to-transparent transition-opacity',
          edge.right ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden
      />
    </div>
  )
}
