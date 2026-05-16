import type { ReactNode } from 'react'

interface Props {
  active?: boolean
  done?: boolean
  num?: number | null
  onClick?: () => void
  children: ReactNode
}

export function NavItem({ active, done, num, onClick, children }: Props) {
  return (
    <button
      type="button"
      className={`nav-item ${active ? 'active' : ''} ${done ? 'done' : ''}`}
      onClick={onClick}
    >
      {num != null
        ? <span className="nav-num">{String(num).padStart(2, '0')}</span>
        : <span className="nav-dot" />}
      <span style={{ flex: 1, lineHeight: 1.25, overflowWrap: 'break-word' }}>
        {children}
      </span>
    </button>
  )
}
