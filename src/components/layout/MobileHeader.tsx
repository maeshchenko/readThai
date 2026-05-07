import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, ChevronLeft } from 'lucide-react'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { getChapterBySlug } from '@/lib/chapters'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/haptic'

interface Props {
  onOpenSettings: () => void
}

export function MobileHeader({ onOpenSettings }: Props) {
  const { i18n, t } = useTranslation()
  const lang = i18n.language as 'en' | 'ru'
  const location = useLocation()
  const navigate = useNavigate()
  const { scrolled, direction } = useScrollDirection({ topOffset: 4, threshold: 12 })
  const [readPct, setReadPct] = useState(0)

  const path = location.pathname.replace(/^\//, '')
  const isHome = path === '' || path === '/'
  const isGlossary = path === 'glossary'
  const chapterMeta = !isHome && !isGlossary ? getChapterBySlug(path) : null
  const isChapter = !!chapterMeta

  useEffect(() => {
    if (!isChapter) {
      setReadPct(0)
      return
    }
    let raf = 0
    const update = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - window.innerHeight
      if (total <= 0) {
        setReadPct(0)
      } else {
        const pct = Math.max(0, Math.min(1, window.scrollY / total)) * 100
        setReadPct(pct)
      }
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [isChapter, location.pathname])

  const title = isHome
    ? t('app.title')
    : isGlossary
    ? t('nav.glossary')
    : chapterMeta
    ? lang === 'ru'
      ? chapterMeta.titleRu
      : chapterMeta.titleEn
    : t('app.title')

  const showBack = !isHome
  const hideOnScroll = direction === 'down' && scrolled

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-transform duration-200 md:hidden',
        hideOnScroll ? '-translate-y-full' : 'translate-y-0',
      )}
      style={{ paddingTop: 'var(--mobile-header-pt)' }}
    >
      <div
        className={cn(
          'flex h-12 items-center gap-2 px-1.5 transition-[background-color,backdrop-filter,box-shadow] duration-200',
          scrolled
            ? 'bg-[var(--color-surface-elevated)]/90 shadow-[0_1px_0_var(--color-hairline)] backdrop-blur-xl'
            : 'bg-transparent',
        )}
      >
        {showBack ? (
          <button
            onClick={() => {
              haptic('selection')
              if (window.history.length > 1) navigate(-1)
              else navigate('/')
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-on-surface)] transition-colors active:bg-[var(--color-surface-dim)]"
            aria-label={t('nav.back')}
          >
            <ChevronLeft size={22} strokeWidth={1.9} />
          </button>
        ) : (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]"
            aria-hidden
          >
            <span
              className="thai-looped font-semibold"
              style={{ fontSize: 28, lineHeight: 1 }}
            >
              ก
            </span>
          </span>
        )}

        <h1
          className={cn(
            'min-w-0 flex-1 truncate text-center text-[15px] font-semibold tracking-tight leading-none transition-opacity duration-200',
            scrolled ? 'opacity-100' : isHome ? 'opacity-0' : 'opacity-100',
          )}
        >
          {title}
        </h1>

        <button
          onClick={() => {
            haptic('selection')
            onOpenSettings()
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-on-surface)] transition-colors active:bg-[var(--color-surface-dim)]"
          aria-label={t('settings.title')}
        >
          <SettingsIcon size={20} strokeWidth={1.85} />
        </button>
      </div>

      {isChapter && (
        <div className="h-[2px] bg-transparent">
          <div
            className="h-full bg-[var(--color-primary-500)] transition-[width] duration-150"
            style={{ width: `${readPct}%` }}
            aria-hidden
          />
        </div>
      )}
    </header>
  )
}
