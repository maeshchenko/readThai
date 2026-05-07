import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, BookOpen, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/haptic'

interface Props {
  onOpenLessons: () => void
  onOpenSettings: () => void
  lessonsOpen?: boolean
  settingsOpen?: boolean
}

type TabId = 'home' | 'lessons' | 'glossary' | 'settings'

export function MobileTabBar({ onOpenLessons, onOpenSettings, lessonsOpen, settingsOpen }: Props) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const path = location.pathname.replace(/^\//, '')
  const active: TabId = settingsOpen
    ? 'settings'
    : lessonsOpen
    ? 'lessons'
    : path === '' || path === '/'
    ? 'home'
    : path === 'glossary'
    ? 'glossary'
    : 'lessons'

  const tabs: { id: TabId; label: string; icon: typeof Home; onClick: () => void }[] = [
    {
      id: 'home',
      label: t('nav.home'),
      icon: Home,
      onClick: () => {
        haptic('selection')
        navigate('/')
      },
    },
    {
      id: 'lessons',
      label: t('home.lessons'),
      icon: BookOpen,
      onClick: () => {
        haptic('selection')
        onOpenLessons()
      },
    },
    {
      id: 'glossary',
      label: t('nav.glossary'),
      icon: Search,
      onClick: () => {
        haptic('selection')
        navigate('/glossary')
      },
    },
    {
      id: 'settings',
      label: t('settings.title', { defaultValue: 'Settings' }),
      icon: Settings,
      onClick: () => {
        haptic('selection')
        onOpenSettings()
      },
    },
  ]

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div
        className="mx-auto flex h-16 items-stretch border-t border-[var(--color-hairline)] bg-[var(--color-surface-elevated)]/85 backdrop-blur-xl"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className="group relative flex flex-1 flex-col items-center justify-center gap-0.5 px-2"
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={cn(
                  'flex h-7 items-center justify-center rounded-full px-3 transition-all duration-200',
                  isActive
                    ? 'bg-[var(--color-primary-600)]/12 text-[var(--color-primary-600)] dark:bg-[var(--color-primary-500)]/18 dark:text-[var(--color-primary-300)]'
                    : 'text-[var(--color-on-surface-muted)] group-active:scale-95',
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.9}
                  fill={isActive ? 'currentColor' : 'none'}
                  fillOpacity={isActive ? 0.18 : 0}
                />
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium leading-none transition-colors',
                  isActive
                    ? 'text-[var(--color-primary-600)] dark:text-[var(--color-primary-300)]'
                    : 'text-[var(--color-on-surface-muted)]',
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
