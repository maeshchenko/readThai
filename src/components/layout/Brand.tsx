import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function Brand() {
  const { i18n } = useTranslation()
  const ru = i18n.language === 'ru'
  return (
    <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
      <div className="brand-mark">ก</div>
      <div className="brand-text">
        <span className="b1">{ru ? 'Читай по‑тайски' : 'Read Thai'}</span>
        <span className="b2">{ru ? 'за 10 дней · Издание II' : 'in 10 days · 2nd ed.'}</span>
      </div>
    </Link>
  )
}
