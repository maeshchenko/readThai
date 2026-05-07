import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Sun, Moon, Monitor, Menu, X, Eye, EyeOff } from 'lucide-react'
import { useThemeStore, useThaiScriptStore } from '@/lib/stores'
import { cn } from '@/lib/cn'

export function Header({ onToggleSidebar, sidebarOpen }: { onToggleSidebar: () => void; sidebarOpen: boolean }) {
  const { i18n, t } = useTranslation()
  const { theme, setTheme } = useThemeStore()
  const { primary, showBoth, setPrimary, setShowBoth } = useThaiScriptStore()

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'ru' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  const themeOptions: { value: 'light' | 'dark' | 'system'; icon: typeof Sun }[] = [
    { value: 'light', icon: Sun },
    { value: 'dark', icon: Moon },
    { value: 'system', icon: Monitor },
  ]

  return (
    <header
      className="sticky top-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl"
      style={{ borderBottom: '1px solid var(--color-hairline)' }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-[var(--color-on-surface-muted)] transition-colors hover:bg-[var(--color-surface-dim)] hover:text-[var(--color-on-surface)] md:hidden"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link
          to="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight transition-opacity hover:opacity-80"
        >
          <span className="thai-looped text-2xl text-[var(--color-primary-600)]">ก</span>
          <span className="hidden sm:inline">{t('app.title')}</span>
        </Link>

        <div className="flex-1" />

        <div className="nav-pill">
          <button
            onClick={() => setPrimary('looped')}
            className={cn(
              'rounded-md px-2 py-1 text-sm transition-all',
              primary === 'looped'
                ? 'bg-[var(--color-surface-elevated)] text-[var(--color-primary-600)] shadow-[var(--shadow-soft)]'
                : 'text-[var(--color-on-surface-muted)] hover:text-[var(--color-on-surface)]',
            )}
            aria-label={t('thaiScript.looped')}
            title={t('thaiScript.looped')}
          >
            <span className="thai-looped">น</span>
          </button>
          <button
            onClick={() => setPrimary('loopless')}
            className={cn(
              'rounded-md px-2 py-1 text-sm transition-all',
              primary === 'loopless'
                ? 'bg-[var(--color-surface-elevated)] text-[var(--color-primary-600)] shadow-[var(--shadow-soft)]'
                : 'text-[var(--color-on-surface-muted)] hover:text-[var(--color-on-surface)]',
            )}
            aria-label={t('thaiScript.loopless')}
            title={t('thaiScript.loopless')}
          >
            <span className="thai-loopless">น</span>
          </button>
          <button
            onClick={() => setShowBoth(!showBoth)}
            className={cn(
              'rounded-md p-1.5 transition-all',
              showBoth
                ? 'bg-[var(--color-accent-500)] text-white shadow-[var(--shadow-soft)]'
                : 'text-[var(--color-on-surface-muted)] hover:text-[var(--color-on-surface)]',
            )}
            aria-label={t('thaiScript.showBoth')}
            title={t('thaiScript.showBoth')}
          >
            {showBoth ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        </div>

        <div className="nav-pill hidden sm:inline-flex">
          {themeOptions.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'rounded-md p-1.5 transition-all',
                theme === value
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-primary-600)] shadow-[var(--shadow-soft)]'
                  : 'text-[var(--color-on-surface-muted)] hover:text-[var(--color-on-surface)]',
              )}
              aria-label={t(`theme.${value}`)}
              title={t(`theme.${value}`)}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>

        <button
          onClick={toggleLang}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold tracking-wider text-[var(--color-on-surface-muted)] ring-1 ring-[var(--color-hairline)] transition-all hover:bg-[var(--color-surface-dim)] hover:text-[var(--color-on-surface)]"
          aria-label="Switch language"
        >
          {i18n.language === 'en' ? 'RU' : 'EN'}
        </button>
      </div>
    </header>
  )
}
