import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'

export interface Crumb {
  label: string
  to?: string
}

interface Props {
  items: Array<Crumb | string>
}

export function Crumbs({ items }: Props) {
  const navigate = useNavigate()
  const norm: Crumb[] = items.map((it) => typeof it === 'string' ? { label: it } : it)
  return (
    <div className="crumbs">
      {norm.map((c, i) => {
        const isLast = i === norm.length - 1
        const cls = isLast ? 'now' : ''
        return (
          <Fragment key={i}>
            {c.to && !isLast
              ? <a className={cls} onClick={() => navigate(c.to!)}>{c.label}</a>
              : <span className={cls}>{c.label}</span>}
            {!isLast && <span className="sep">/</span>}
          </Fragment>
        )
      })}
    </div>
  )
}
