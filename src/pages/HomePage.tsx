import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  BookMarked,
  ChevronRight,
  Headphones,
  Sparkles,
  Search,
  Flame,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { chapters } from '@/lib/chapters'
import { useProgressStore } from '@/lib/stores'
import { haptic } from '@/lib/haptic'
import { useIsMobile } from '@/hooks/useMediaQuery'

export function HomePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { listenedTracks, lastChapter, streakDays, todayCount } = useProgressStore()
  const lang = i18n.language as 'en' | 'ru'

  const lessonChapters = useMemo(
    () =>
      chapters.filter(
        (c) =>
          c.id.startsWith('day-') ||
          c.id === 'last-day' ||
          c.id === 'intermission' ||
          c.id === 'preliminary',
      ),
    [],
  )

  const totalTracks = chapters.reduce((sum, c) => sum + c.tracks.length, 0)
  const doneCount = listenedTracks.size
  const lastChapterMeta = lastChapter ? chapters.find((c) => c.slug === lastChapter) : null
  const lastChapterPct = lastChapterMeta
    ? lastChapterMeta.tracks.length > 0
      ? (lastChapterMeta.tracks.filter((t) => listenedTracks.has(t)).length /
          lastChapterMeta.tracks.length) *
        100
      : 0
    : 0

  const greeting = useGreeting(lang)
  const dailyGoal = 2

  return (
    <div className="mx-auto max-w-3xl">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 md:mb-12 md:text-center"
      >
        <div className="mb-1 text-sm text-[var(--color-on-surface-muted)] md:hidden">
          {greeting}
        </div>

        <h1 className="text-[26px] font-semibold leading-[1.15] tracking-tight text-balance md:mb-4 md:text-5xl md:font-bold md:leading-tight">
          <span className="md:hidden">{lang === 'ru' ? 'Готовы к уроку?' : 'Ready for a lesson?'}</span>
          <span className="hidden md:block">{t('app.title')}</span>
        </h1>

        <div className="hidden md:block">
          <div className="mb-7 inline-flex flex-col items-center justify-center gap-1 rounded-3xl bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-primary-100)] px-7 py-5 ring-1 ring-[var(--color-hairline)] dark:from-[var(--color-primary-900)]/30 dark:to-[var(--color-primary-800)]/20">
            <span className="thai-large-looped bg-gradient-to-br from-[var(--color-primary-700)] to-[var(--color-primary-500)] bg-clip-text text-transparent dark:from-[var(--color-primary-300)] dark:to-[var(--color-primary-500)]">
              กขค
            </span>
            <span className="thai-large-loopless text-xl text-[var(--color-primary-400)]/70">กขค</span>
          </div>
          <p className="mx-auto mb-9 max-w-xl text-lg text-balance text-[var(--color-on-surface-muted)]">
            {t('home.hero')}
          </p>
        </div>

        {streakDays > 0 && (
          <div className="mt-3 flex items-center gap-2 md:hidden">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
              <Flame size={13} fill="currentColor" />
              {t('home.streakDays', { count: streakDays })}
            </span>
            <span className="text-xs text-[var(--color-on-surface-muted)] tabular-nums">
              {t('home.todayGoal', { done: todayCount, total: dailyGoal })}
            </span>
          </div>
        )}

        <div className="mt-5 md:mt-0 md:hidden">
          <ContinueCard
            chapter={lastChapterMeta}
            pct={lastChapterPct}
            lang={lang}
            onTap={(slug) => {
              haptic('selection')
              navigate(`/${slug}`)
            }}
          />
        </div>

        <div className="hidden md:flex md:flex-col md:items-center md:gap-3 md:sm:flex-row md:sm:justify-center sm:flex-row">
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
          <div className="mt-7 hidden md:inline-flex md:items-center md:gap-3 md:rounded-full md:bg-[var(--color-surface-elevated)] md:px-4 md:py-2 md:text-sm md:ring-1 md:ring-[var(--color-hairline)]">
            <ProgressRing pct={(doneCount / totalTracks) * 100} size={22} />
            <span className="text-[var(--color-on-surface-muted)]">
              {t('home.progress', { done: doneCount, total: totalTracks })}
            </span>
          </div>
        )}
      </motion.section>

      {/* Lessons */}
      <section className="mb-8">
        <div className="mb-3 flex items-baseline justify-between md:mb-5">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{t('home.lessons')}</h2>
          <span className="eyebrow">{lessonChapters.length}</span>
        </div>

        {isMobile ? (
          <LessonCarousel
            chapters={lessonChapters}
            lang={lang}
            listenedTracks={listenedTracks}
            onTap={(slug) => {
              haptic('selection')
              navigate(`/${slug}`)
            }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {lessonChapters.map((ch, i) => {
              const title = lang === 'ru' ? ch.titleRu : ch.titleEn
              const listened = ch.tracks.filter((t) => listenedTracks.has(t)).length
              const total = ch.tracks.length
              const pct = total > 0 ? (listened / total) * 100 : 0

              return (
                <motion.div
                  key={ch.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                >
                  <Link
                    to={`/${ch.slug}`}
                    className="group flex h-full flex-col rounded-2xl bg-[var(--color-surface-elevated)] p-5 ring-1 ring-[var(--color-hairline)] shadow-[var(--shadow-soft)] transition-all hover:-translate-y-[2px] hover:shadow-[var(--shadow-elev)]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
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
        )}
      </section>

      {/* Reference (mobile) */}
      <section className="mb-2 md:hidden">
        <h2 className="mb-3 text-base font-semibold tracking-tight">
          {lang === 'ru' ? 'Справочник' : 'Reference'}
        </h2>
        <div className="space-y-1.5">
          <ReferenceLink
            to="/pronunciation"
            label={t('nav.pronunciation')}
            sub={lang === 'ru' ? '8 треков' : '8 tracks'}
          />
          <ReferenceLink
            to="/introduction"
            label={t('nav.introduction')}
            sub={lang === 'ru' ? 'обзор' : 'overview'}
          />
          <ReferenceLink
            to="/glossary"
            label={t('nav.glossary')}
            sub={lang === 'ru' ? 'словарь' : 'dictionary'}
          />
        </div>
      </section>
    </div>
  )
}

function ContinueCard({
  chapter,
  pct,
  lang,
  onTap,
}: {
  chapter: { slug: string; titleEn: string; titleRu: string; tracks: number[] } | null | undefined
  pct: number
  lang: 'en' | 'ru'
  onTap: (slug: string) => void
}) {
  if (!chapter) {
    const cta = lang === 'ru' ? 'Начать' : 'Start'
    return (
      <button
        onClick={() => onTap('day-1')}
        className="group relative flex w-full items-stretch gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-500)] px-5 py-5 text-left text-white shadow-[0_8px_24px_-12px_rgba(74,82,214,0.45)] transition-transform active:scale-[0.99]"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <Sparkles size={20} strokeWidth={1.85} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center pr-2">
          <div className="text-[11px] font-medium uppercase tracking-wider text-white/80">
            {lang === 'ru' ? 'С чего начать' : 'Start here'}
          </div>
          <div className="line-clamp-2 text-pretty text-base font-semibold leading-snug">
            {lang === 'ru' ? 'День 1 — Система классов' : 'Day 1 — The Class System'}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 self-center text-sm font-medium text-white/95">
          {cta}
          <ChevronRight size={18} className="shrink-0 transition-transform group-active:translate-x-0.5" />
        </div>
      </button>
    )
  }

  const title = lang === 'ru' ? chapter.titleRu : chapter.titleEn
  const total = chapter.tracks.length
  const listened = total > 0 ? Math.round((pct / 100) * total) : 0
  const cta = lang === 'ru' ? 'Продолжить' : 'Resume'
  return (
    <button
      onClick={() => onTap(chapter.slug)}
      className="group relative flex w-full items-stretch gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-500)] px-5 py-5 text-left text-white shadow-[0_8px_24px_-12px_rgba(74,82,214,0.45)] transition-transform active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
        <BookMarked size={20} strokeWidth={1.85} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center pr-2">
        <div className="text-[11px] font-medium uppercase tracking-wider text-white/80">
          {lang === 'ru' ? 'Продолжить' : 'Continue'}
        </div>
        <div className="line-clamp-2 text-pretty text-base font-semibold leading-snug">
          {title}
        </div>
        {total > 0 && (
          <div className="mt-1 text-[11px] tabular-nums text-white/80">
            {lang === 'ru'
              ? `${listened} из ${total} · ${Math.round(pct)}%`
              : `${listened} of ${total} · ${Math.round(pct)}%`}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 self-center text-sm font-medium text-white/95">
        {cta}
        <ChevronRight size={18} className="shrink-0 transition-transform group-active:translate-x-0.5" />
      </div>
    </button>
  )
}

function ReferenceLink({ to, label, sub }: { to: string; label: string; sub: string }) {
  return (
    <Link
      to={to}
      onClick={() => haptic('selection')}
      className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-elevated)] px-4 py-3 ring-1 ring-[var(--color-hairline)] transition-colors active:bg-[var(--color-surface-dim)]"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-500)]/10 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]">
        <BookOpen size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{label}</div>
        <div className="truncate text-[11px] text-[var(--color-on-surface-muted)]">{sub}</div>
      </div>
      <ChevronRight size={16} className="shrink-0 text-[var(--color-on-surface-faint)]" />
    </Link>
  )
}

function LessonCarousel({
  chapters: lessons,
  lang,
  listenedTracks,
  onTap,
}: {
  chapters: typeof chapters
  lang: 'en' | 'ru'
  listenedTracks: Set<number>
  onTap: (slug: string) => void
}) {
  return (
    <div className="relative -mx-4">
      <div
        className="overflow-x-auto scroll-smooth scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollPaddingLeft: 16,
          scrollPaddingRight: 16,
        }}
      >
        <div className="flex gap-3 pl-4 pr-8 pb-3 pt-1">
          {lessons.map((ch, i) => {
            const title = lang === 'ru' ? ch.titleRu : ch.titleEn
            const total = ch.tracks.length
            const listened = ch.tracks.filter((t) => listenedTracks.has(t)).length
            const pct = total > 0 ? (listened / total) * 100 : 0
            const status: 'done' | 'in-progress' | 'new' =
              total > 0 && listened === total ? 'done' : listened > 0 ? 'in-progress' : 'new'

            return (
              <button
                key={ch.id}
                onClick={() => onTap(ch.slug)}
                className="group relative flex shrink-0 flex-col rounded-2xl bg-[var(--color-surface-elevated)] p-4 text-left ring-1 ring-[var(--color-hairline)] shadow-[var(--shadow-soft)] transition-all active:scale-[0.985]"
                style={{ scrollSnapAlign: 'start', width: '86%', maxWidth: 300 }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-on-surface-faint)] tabular-nums">
                    #{(i + 1).toString().padStart(2, '0')}
                  </span>
                  <StatusBadge status={status} lang={lang} />
                </div>
                <div className="mb-3 line-clamp-2 min-h-[2.6em] break-words text-[15px] font-semibold tracking-tight text-balance">
                  {title}
                </div>
                <div className="mt-auto flex items-center gap-3">
                  <ProgressRing pct={pct} size={32} done={status === 'done'} />
                  <div className="min-w-0 flex-1 text-[11px] tabular-nums text-[var(--color-on-surface-muted)]">
                    {total > 0 ? `${listened}/${total} · ${Math.round(pct)}%` : lang === 'ru' ? 'Чтение' : 'Reading'}
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-[var(--color-on-surface-faint)] transition-transform group-active:translate-x-0.5" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--color-surface)] to-transparent"
      />
    </div>
  )
}

function StatusBadge({ status, lang }: { status: 'done' | 'in-progress' | 'new'; lang: 'en' | 'ru' }) {
  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-500)]/12 px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent-600)] dark:text-[var(--color-accent-400)]">
        {lang === 'ru' ? 'Готово' : 'Done'}
      </span>
    )
  }
  if (status === 'in-progress') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-500)]/12 px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]">
        {lang === 'ru' ? 'В процессе' : 'In progress'}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-dim)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-on-surface-muted)]">
      {lang === 'ru' ? 'Новый' : 'New'}
    </span>
  )
}

function ProgressRing({ pct, size = 24, done = false }: { pct: number; size?: number; done?: boolean }) {
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
        strokeWidth="2.5"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={done ? 'var(--color-accent-500)' : 'var(--color-primary-500)'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  )
}

function useGreeting(lang: 'en' | 'ru'): string {
  const [greeting, setGreeting] = useState('')
  useEffect(() => {
    const h = new Date().getHours()
    let key = 'greetingEvening'
    if (h < 5) key = 'greetingNight'
    else if (h < 12) key = 'greetingMorning'
    else if (h < 18) key = 'greetingAfternoon'
    else if (h < 23) key = 'greetingEvening'
    else key = 'greetingNight'
    const dict = lang === 'ru' ? {
      greetingNight: 'Доброй ночи',
      greetingMorning: 'Доброе утро',
      greetingAfternoon: 'Добрый день',
      greetingEvening: 'Добрый вечер',
    } : {
      greetingNight: 'Good night',
      greetingMorning: 'Good morning',
      greetingAfternoon: 'Good afternoon',
      greetingEvening: 'Good evening',
    }
    setGreeting(dict[key as keyof typeof dict])
  }, [lang])
  return greeting
}
