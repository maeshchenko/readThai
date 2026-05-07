import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { getChapterBySlug, getAdjacentChapters } from '@/lib/chapters'
import { useProgressStore } from '@/lib/stores'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { ContentRenderer } from '@/components/content/ContentRenderer'
import type { Chapter } from '@/lib/contentTypes'

export function ChapterPage() {
  const location = useLocation()
  const slug = location.pathname.replace(/^\//, '')
  const { i18n, t } = useTranslation()
  const lang = i18n.language as 'en' | 'ru'
  const { setLastChapter } = useProgressStore()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)

  const meta = getChapterBySlug(slug)
  const { prev, next } = getAdjacentChapters(slug)

  useEffect(() => {
    if (!slug) return
    setLastChapter(slug)
    setLoading(true)
    window.scrollTo(0, 0)

    const fileId = slug.replace(/\//g, '-')
    import(`../content/${fileId}.json`)
      .then((mod) => {
        setChapter(mod.default as Chapter)
        setLoading(false)
      })
      .catch(() => {
        setChapter(null)
        setLoading(false)
      })
  }, [slug, setLastChapter])

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
    <motion.article
      key={slug}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-3xl"
    >
      <h1 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>

      {loading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-[var(--color-surface-dim)]" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      ) : chapter ? (
        <ContentRenderer blocks={chapter.blocks} footnotes={chapter.footnotes} />
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-dim)] p-8 text-center">
          <p className="text-[var(--color-on-surface-muted)]">
            Content for this chapter is being prepared. Check back soon!
          </p>
        </div>
      )}

      <nav className="mt-12 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
        {prev ? (
          <Link to={`/${prev.slug}`} className="btn btn-ghost">
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">{lang === 'ru' ? prev.titleRu : prev.titleEn}</span>
            <span className="sm:hidden">{t('nav.prevChapter')}</span>
          </Link>
        ) : <div />}
        {next ? (
          <Link to={`/${next.slug}`} className="btn btn-primary">
            <span className="hidden sm:inline">{lang === 'ru' ? next.titleRu : next.titleEn}</span>
            <span className="sm:hidden">{t('nav.nextChapter')}</span>
            <ChevronRight size={16} />
          </Link>
        ) : <div />}
      </nav>
    </motion.article>
  )
}
