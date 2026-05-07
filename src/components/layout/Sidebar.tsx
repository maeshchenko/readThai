import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { chapters } from '@/lib/chapters'
import { useProgressStore } from '@/lib/stores'
import { cn } from '@/lib/cn'
import { CheckCircle2 } from 'lucide-react'

interface Group {
  id: string
  labelEn: string
  labelRu: string
  ids: string[]
}

const GROUPS: Group[] = [
  {
    id: 'intro',
    labelEn: 'Getting Started',
    labelRu: 'Начало',
    ids: ['preface', 'introduction', 'pronunciation'],
  },
  {
    id: 'lessons',
    labelEn: 'Lessons',
    labelRu: 'Уроки',
    ids: ['day-1', 'day-2', 'day-3', 'day-4', 'day-5', 'intermission', 'day-6', 'day-7', 'day-8', 'day-9', 'preliminary', 'last-day'],
  },
  {
    id: 'reference',
    labelEn: 'Reference',
    labelRu: 'Справочник',
    ids: ['appendix-i', 'appendix-ii', 'appendix-iii', 'appendix-iv', 'appendix-v', 'glossary'],
  },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { i18n, t } = useTranslation()
  const { listenedTracks } = useProgressStore()
  const lang = i18n.language as 'en' | 'ru'

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-72 overflow-y-auto bg-[var(--color-surface)]/95 backdrop-blur-md p-4 transition-transform duration-200 md:sticky md:translate-x-0',
          'md:bg-transparent md:backdrop-blur-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ borderRight: '1px solid var(--color-hairline)' }}
      >
        <nav aria-label={t('nav.tableOfContents')} className="space-y-6">
          {GROUPS.map((group) => {
            const groupChapters = group.ids
              .map((id) => chapters.find((c) => c.id === id))
              .filter((c): c is NonNullable<typeof c> => !!c)
            if (!groupChapters.length) return null
            return (
              <div key={group.id}>
                <p className="eyebrow mb-2.5 px-3">
                  {lang === 'ru' ? group.labelRu : group.labelEn}
                </p>
                <ul className="space-y-0.5">
                  {groupChapters.map((ch) => {
                    const title = lang === 'ru' ? ch.titleRu : ch.titleEn
                    const allListened =
                      ch.tracks.length > 0 && ch.tracks.every((t) => listenedTracks.has(t))
                    const someListened =
                      ch.tracks.length > 0 && ch.tracks.some((t) => listenedTracks.has(t))

                    return (
                      <li key={ch.id}>
                        <NavLink
                          to={`/${ch.slug}`}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all',
                              isActive
                                ? 'bg-[var(--color-primary-50)] font-medium text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/20 dark:text-[var(--color-primary-300)]'
                                : 'text-[var(--color-on-surface)] hover:bg-[var(--color-surface-dim)]',
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <span className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-[var(--color-primary-500)]" />
                              )}
                              <ProgressDot listened={allListened} active={someListened} />
                              <span className="flex-1 truncate">{title}</span>
                              {allListened && (
                                <CheckCircle2 size={13} className="shrink-0 text-[var(--color-accent-500)]" />
                              )}
                            </>
                          )}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

function ProgressDot({ listened, active }: { listened: boolean; active: boolean }) {
  return (
    <span
      className={cn(
        'h-1.5 w-1.5 shrink-0 rounded-full transition-colors',
        listened
          ? 'bg-[var(--color-accent-500)]'
          : active
          ? 'bg-[var(--color-primary-400)]'
          : 'bg-[var(--color-on-surface-faint)]/30',
      )}
    />
  )
}
