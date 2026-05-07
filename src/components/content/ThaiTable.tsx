import type { ThaiTableRow, TableHeaderRow } from '@/lib/contentTypes'
import { ThaiText } from './ThaiText'
import { cn } from '@/lib/cn'

interface Props {
  columns: string[]
  rows: ThaiTableRow[]
  headerRows?: TableHeaderRow[]
  stickyFirstCol?: boolean
}

export function ThaiTable({ columns, rows, headerRows, stickyFirstCol }: Props) {
  const hasMeaning = rows.some((r) => r.meaning)
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-[var(--color-hairline)] shadow-[var(--shadow-soft)]">
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
                <td className="translit px-4 py-2.5">{row.translit}</td>
              )}
              {hasMeaning && (
                <td className="px-4 py-2.5 text-sm text-[var(--color-on-surface-muted)]">
                  {row.meaning ?? ''}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
