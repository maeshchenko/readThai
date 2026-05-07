import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { getChapterBySlug, getAdjacentChapters } from '@/lib/chapters'
import { useProgressStore, useReaderStore } from '@/lib/stores'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { ContentRenderer } from '@/components/content/ContentRenderer'
import { ReadingToolbar } from '@/components/layout/ReadingToolbar'
import { ChapterSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/haptic'
import { loadChapter, prefetchChapter } from '@/lib/chapterLoader'
import type { Chapter } from '@/lib/contentTypes'

const FONT_SIZE_CLASS = {
  sm: 'text-[15px] leading-[1.7]',
  md: 'text-[17px] leading-[1.75]',
  lg: 'text-[19px] leading-[1.8]',
}

export function ChapterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const slug = location.pathname.replace(/^\//, '')
  const { i18n, t } = useTranslation()
  const lang = i18n.language as 'en' | 'ru'
  const { setLastChapter } = useProgressStore()
  const { fontSize } = useReaderStore()
  const isMobile = useIsMobile()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)

  const meta = getChapterBySlug(slug)
  const { prev, next } = getAdjacentChapters(slug)

  useEffect(() => {
    if (!slug) return
    setLastChapter(slug)
    setLoading(true)
    window.scrollTo(0, 0)

    let cancelled = false
    loadChapter(slug)
      .then((data) => {
        if (cancelled) return
        setChapter(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setChapter(null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug, setLastChapter])

  useEffect(() => {
    if (next?.slug) {
      const id = window.setTimeout(() => prefetchChapter(next.slug), 600)
      return () => window.clearTimeout(id)
    }
  }, [next?.slug])

  if (!meta) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-[var(--color-on-surface-muted)]">Chapter not found</p>
        <Link to="/" className="btn btn-primary mt-4">{t('nav.home')}</Link>
      </div>
    )
  }

  const title = lang === 'ru' ? meta.titleRu : meta.titleEn

  return (
    <>
      <SwipeableChapter
        slug={slug}
        prevSlug={prev?.slug}
        nextSlug={next?.slug}
        enabled={isMobile}
        navigate={navigate}
      >
        <article className={cn('mx-auto max-w-3xl', FONT_SIZE_CLASS[fontSize])}>
          <h1 className="mb-3 text-[26px] font-bold leading-[1.15] tracking-tight text-balance md:mb-8 md:text-4xl md:leading-tight">
            {title}
          </h1>
          {meta.tracks.length > 0 && (
            <p className="mb-6 hidden text-sm text-[var(--color-on-surface-muted)] md:block">
              {meta.tracks.length} {lang === 'ru' ? 'аудио-треков' : 'audio tracks'}
            </p>
          )}

          {loading ? (
            <ChapterSkeleton />
          ) : chapter ? (
            <ContentRenderer blocks={chapter.blocks} footnotes={chapter.footnotes} footnotesRu={chapter.footnotesRu} />
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-dim)] p-8 text-center">
              <p className="text-[var(--color-on-surface-muted)]">
                {lang === 'ru' ? 'Содержимое этой главы готовится. Скоро будет!' : 'Content for this chapter is being prepared. Check back soon!'}
              </p>
            </div>
          )}

          <PrevNextNav prev={prev} next={next} lang={lang} />
        </article>
      </SwipeableChapter>

      {isMobile && <ReadingToolbar slug={slug} />}
    </>
  )
}

function PrevNextNav({
  prev,
  next,
  lang,
}: {
  prev: ReturnType<typeof getAdjacentChapters>['prev']
  next: ReturnType<typeof getAdjacentChapters>['next']
  lang: 'en' | 'ru'
}) {
  return (
    <nav className="mt-12 grid grid-cols-2 gap-3 border-t border-[var(--color-hairline)] pt-6">
      {prev ? (
        <Link
          to={`/${prev.slug}`}
          onClick={() => haptic('selection')}
          className="group flex items-center gap-2.5 rounded-2xl bg-[var(--color-surface-elevated)] p-3.5 ring-1 ring-[var(--color-hairline)] transition-all active:scale-[0.98]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-dim)] text-[var(--color-on-surface-muted)]">
            <ChevronLeft size={18} />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-on-surface-faint)]">
              {lang === 'ru' ? 'Назад' : 'Previous'}
            </span>
            <span className="block truncate text-[13px] font-medium leading-tight">
              {lang === 'ru' ? prev.titleRu : prev.titleEn}
            </span>
          </span>
        </Link>
      ) : <span />}
      {next ? (
        <Link
          to={`/${next.slug}`}
          onClick={() => haptic('selection')}
          className="group flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-500)] p-3.5 text-white shadow-[0_8px_24px_-12px_rgba(74,82,214,0.55)] transition-all active:scale-[0.98] col-start-2"
        >
          <span className="min-w-0 flex-1 text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/80">
              {lang === 'ru' ? 'Далее' : 'Next'}
            </span>
            <span className="block truncate text-[13px] font-medium leading-tight">
              {lang === 'ru' ? next.titleRu : next.titleEn}
            </span>
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur">
            <ChevronRight size={18} />
          </span>
        </Link>
      ) : <span />}
    </nav>
  )
}

function SwipeableChapter({
  slug,
  prevSlug,
  nextSlug,
  enabled,
  navigate,
  children,
}: {
  slug: string
  prevSlug?: string
  nextSlug?: string
  enabled: boolean
  navigate: ReturnType<typeof useNavigate>
  children: React.ReactNode
}) {
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-200, 0, 200], [0.6, 1, 0.6])
  const containerRef = useRef<HTMLDivElement>(null)

  if (!enabled) {
    return (
      <motion.div
        key={slug}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    )
  }

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    const dx = info.offset.x
    const vx = info.velocity.x
    if ((dx < -120 || vx < -600) && nextSlug) {
      haptic('selection')
      navigate(`/${nextSlug}`)
    } else if ((dx > 120 || vx > 600) && prevSlug) {
      haptic('selection')
      navigate(`/${prevSlug}`)
    }
  }

  return (
    <motion.div
      ref={containerRef}
      key={slug}
      style={{ x, opacity, touchAction: 'pan-y' }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      dragDirectionLock
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}
