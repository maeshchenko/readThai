import { useTranslation } from 'react-i18next'

export function LangSwitcher() {
  const { i18n } = useTranslation()
  const set = (lang: 'ru' | 'en') => {
    i18n.changeLanguage(lang)
    try { localStorage.setItem('lang', lang) } catch { /* ignore */ }
  }
  return (
    <div className="lang">
      <button
        type="button"
        className={i18n.language === 'ru' ? 'active' : ''}
        onClick={() => set('ru')}
      >
        RU
      </button>
      <button
        type="button"
        className={i18n.language === 'en' ? 'active' : ''}
        onClick={() => set('en')}
      >
        EN
      </button>
    </div>
  )
}
