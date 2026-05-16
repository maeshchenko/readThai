import type { ThaiTableRow, TableHeaderRow } from '@/lib/contentTypes'

interface Props {
  columns: string[]
  rows: ThaiTableRow[]
  headerRows?: TableHeaderRow[]
  lang: 'en' | 'ru'
}

export function RefTable({ columns, rows, headerRows, lang }: Props) {
  const ru = lang === 'ru'
  const hasMeaning = rows.some((r) => r.meaning || r.meaningRu)
  return (
    <div className="ref-table-wrap">
    <table className="ref-table">
      <thead>
        {headerRows?.map((hr, i) => (
          <tr key={`hr-${i}`}>
            {hr.map((cell, j) => (
              <th key={j} colSpan={cell.colSpan} style={cell.align ? { textAlign: cell.align } : undefined}>
                {cell.text}
              </th>
            ))}
          </tr>
        ))}
        <tr>
          {columns.map((c, i) => <th key={i}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="glyph-cell">{r.thai}</td>
            <td className="ipa">{(ru && r.translitRu) || r.translit}</td>
            {hasMeaning && (
              <td className="name">{(ru && r.meaningRu) || r.meaning || '—'}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}
