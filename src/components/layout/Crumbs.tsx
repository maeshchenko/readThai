import { Fragment } from 'react'

interface Props {
  items: string[]
}

export function Crumbs({ items }: Props) {
  return (
    <div className="crumbs">
      {items.map((c, i) => (
        <Fragment key={i}>
          <span className={i === items.length - 1 ? 'now' : ''}>{c}</span>
          {i < items.length - 1 && <span className="sep">/</span>}
        </Fragment>
      ))}
    </div>
  )
}
