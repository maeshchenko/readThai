interface Props {
  value?: number
  size?: number
}

export function Ring({ value = 0 }: Props) {
  const r = 18
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  const off = c * (1 - v)
  const pct = Math.round(v * 100)
  return (
    <div className="ring">
      <svg viewBox="0 0 44 44">
        <circle className="track" cx="22" cy="22" r={r} />
        <circle className="fill" cx="22" cy="22" r={r} strokeDasharray={c} strokeDashoffset={off} />
        {v > 0 && (
          <text x="22" y="22" textAnchor="middle" dominantBaseline="middle">{pct}</text>
        )}
      </svg>
    </div>
  )
}
