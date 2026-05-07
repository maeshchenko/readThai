import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { chapters } from '@/lib/chapters'
import { useProgressStore } from '@/lib/stores'
import { BookOpen, ChevronRight, Headphones, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function HomePage() {
  const { t, i18n } = useTranslation()
  const { listenedTracks, lastChapter } = useProgressStore()
  const lang = i18n.language as 'en' | 'ru'

  const lessonChapters = chapters.filter(
    (c) => c.id.startsWith('day-') || c.id === 'last-day' || c.id === 'intermission' || c.id === 'preliminary',
  )

  const totalTracks = chapters.reduce((sum, c) => sum + c.tracks.length, 0)
  const doneCount = [...listenedTracks].length
  const lastChapterMeta = lastChapter ? chapters.find((c) => c.slug === lastChapter) : null

  return (
    <div className="mx-auto max-w-3xl">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-14 text-center"
      >
        <div className="mb-7 inline-flex flex-col items-center justify-center gap-1 rounded-3xl bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-primary-100)] px-7 py-5 ring-1 ring-[var(--color-hairline)] dark:from-[var(--color-primary-900)]/30 dark:to-[var(--color-primary-800)]/20">
          <span className="thai-large-looped bg-gradient-to-br from-[var(--color-primary-700)] to-[var(--color-primary-500)] bg-clip-text text-transparent dark:from-[var(--color-primary-300)] dark:to-[var(--color-primary-500)]">
            กขค
          </span>
          <span className="thai-large-loopless text-xl text-[var(--color-primary-400)]/70">กขค</span>
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance md:text-5xl">
          {t('app.title')}
        </h1>
        <p className="mx-auto mb-9 max-w-xl text-lg text-balance text-[var(--color-on-surface-muted)]">
          {t('home.hero')}
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {lastChapter && lastChapterMeta ? (
            <Link to={`/${lastChapter}`} className="btn btn-primary text-base">
              <Sparkles size={16} />
              {t('home.continueFrom', {
                chapter: lang === 'ru' ? lastChapterMeta.titleRu : lastChapterMeta.titleEn,
              })}
              <ChevronRight size={16} />
            </Link>
          ) : (
            <Link to="/day-1" className="btn btn-primary text-base">
              {t('home.startLearning')}
              <ChevronRight size={16} />
            </Link>
          )}
          <Link to="/pronunciation" className="btn btn-ghost text-base">
            <Headphones size={16} />
            {t('nav.pronunciation')}
          </Link>
        </div>

        {doneCount > 0 && (
          <div className="mt-7 inline-flex items-center gap-3 rounded-full bg-[var(--color-surface-elevated)] px-4 py-2 text-sm ring-1 ring-[var(--color-hairline)]">
            <ProgressRing pct={(doneCount / totalTracks) * 100} size={22} />
            <span className="text-[var(--color-on-surface-muted)]">
              {t('home.progress', { done: doneCount, total: totalTracks })}
            </span>
          </div>
        )}
      </motion.section>

      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">{t('home.lessons')}</h2>
          <span className="eyebrow">{lessonChapters.length}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {lessonChapters.map((ch, i) => {
            const title = lang === 'ru' ? ch.titleRu : ch.titleEn
            const listened = ch.tracks.filter((t) => listenedTracks.has(t)).length
            const total = ch.tracks.length
            const pct = total > 0 ? (listened / total) * 100 : 0

            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Link
                  to={`/${ch.slug}`}
                  className="group flex h-full flex-col rounded-2xl bg-[var(--color-surface-elevated)] p-5 ring-1 ring-[var(--color-hairline)] shadow-[var(--shadow-soft)] transition-all hover:-translate-y-[2px] hover:shadow-[var(--shadow-elev)]"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen size={15} className="shrink-0 text-[var(--color-primary-500)]" />
                      <span className="truncate font-medium tracking-tight">{title}</span>
                    </div>
                    {total > 0 ? (
                      <ProgressRing pct={pct} size={26} />
                    ) : (
                      <ChevronRight size={16} className="shrink-0 text-[var(--color-on-surface-faint)] transition-transform group-hover:translate-x-0.5" />
                    )}
                  </div>
                  {total > 0 && (
                    <div className="mt-auto flex items-center gap-2 text-xs text-[var(--color-on-surface-muted)]">
                      <span className="tabular-nums">{listened}/{total}</span>
                      <span className="text-[var(--color-on-surface-faint)]">·</span>
                      <span className="tabular-nums">{Math.round(pct)}%</span>
                    </div>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function ProgressRing({ pct, size = 24 }: { pct: number; size?: number }) {
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.max(0, Math.min(100, pct)) / 100) * c

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-hairline)"
        strokeWidth="2"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-accent-500)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  )
}
