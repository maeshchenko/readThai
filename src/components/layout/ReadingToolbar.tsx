import { useTranslation } from 'react-i18next'
import { Bookmark, BookmarkCheck, Type, ListTree, Share2 } from 'lucide-react'
import { useReaderStore, useProgressStore, useThaiScriptStore, type FontSize } from '@/lib/stores'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { useAudio } from '@/lib/audio'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/haptic'

interface Props {
  slug: string
  onOpenToc?: () => void
}

const SIZES: FontSize[] = ['sm', 'md', 'lg']

export function ReadingToolbar({ slug, onOpenToc }: Props) {
  const { t, i18n } = useTranslation()
  const { fontSize, setFontSize } = useReaderStore()
  const { bookmarks, toggleBookmark } = useProgressStore()
  const { primary, setPrimary } = useThaiScriptStore()
  const { direction, scrolled } = useScrollDirection({ topOffset: 60, threshold: 14 })
  const miniVisible = useAudio((s) => !!s.track && !s.miniHidden)
  const toast = useToast()
  const lang = i18n.language as 'en' | 'ru'

  const isBookmarked = bookmarks.includes(slug)
  const hide = direction === 'down' && scrolled

  const cycleFont = () => {
    const idx = SIZES.indexOf(fontSize)
    const next = SIZES[(idx + 1) % SIZES.length]
    haptic('selection')
    setFontSize(next)
  }

  const handleShare = async () => {
    haptic('selection')
    const url = window.location.href
    const title = document.title
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        toast.success(lang === 'ru' ? 'Ссылка скопирована' : 'Link copied')
      } catch {
        toast.error(lang === 'ru' ? 'Не удалось скопировать' : 'Could not copy link')
      }
    }
  }

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-30 flex justify-center transition-transform duration-200 md:hidden',
        hide ? 'translate-y-[150%]' : 'translate-y-0',
      )}
      style={{ bottom: miniVisible ? 'calc(var(--tabbar-total) + 70px)' : 'calc(var(--tabbar-total) + 10px)' }}
    >
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-[var(--color-surface-elevated)]/95 px-1.5 py-1 shadow-[var(--shadow-pop)] ring-1 ring-[var(--color-hairline)] backdrop-blur-xl">
        {onOpenToc && (
          <ToolbarButton onClick={() => { haptic('selection'); onOpenToc() }} ariaLabel={t('nav.tableOfContents')}>
            <ListTree size={17} strokeWidth={1.85} />
          </ToolbarButton>
        )}
        <ToolbarButton onClick={cycleFont} ariaLabel={t('chapter.fontSize')}>
          <Type size={16} strokeWidth={1.85} />
          <span className="ml-0.5 text-[10px] font-semibold uppercase tabular-nums">{fontSize}</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            haptic('selection')
            setPrimary(primary === 'looped' ? 'loopless' : 'looped')
          }}
          ariaLabel={primary === 'looped' ? t('thaiScript.loopless') : t('thaiScript.looped')}
        >
          <span className={cn('text-base', primary === 'looped' ? 'thai-looped' : 'thai-loopless')}>น</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            haptic(isBookmarked ? 'selection' : 'success')
            toggleBookmark(slug)
            toast.show(
              isBookmarked
                ? lang === 'ru' ? 'Закладка снята' : 'Bookmark removed'
                : lang === 'ru' ? 'Добавлено в закладки' : 'Bookmarked',
              { variant: isBookmarked ? 'default' : 'success' },
            )
          }}
          active={isBookmarked}
          ariaLabel={t('chapter.bookmark')}
        >
          {isBookmarked ? <BookmarkCheck size={17} strokeWidth={1.9} /> : <Bookmark size={17} strokeWidth={1.85} />}
        </ToolbarButton>
        <ToolbarButton onClick={handleShare} ariaLabel={t('chapter.share')}>
          <Share2 size={17} strokeWidth={1.85} />
        </ToolbarButton>
        <span className="sr-only">{lang === 'ru' ? 'Панель чтения' : 'Reading toolbar'}</span>
      </div>
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  active,
  ariaLabel,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  ariaLabel?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-9 min-w-[36px] items-center justify-center rounded-full px-2.5 transition-all active:scale-[0.94]',
        active
          ? 'bg-[var(--color-primary-600)]/12 text-[var(--color-primary-600)] dark:text-[var(--color-primary-300)]'
          : 'text-[var(--color-on-surface)] hover:bg-[var(--color-surface-dim)]',
      )}
    >
      {children}
    </button>
  )
}
