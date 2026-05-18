import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getChapterBySlug, getAdjacentChapters } from '@/lib/chapters'
import { useProgressStore } from '@/lib/stores'
import { ContentRenderer } from '@/components/content/ContentRenderer'
import { loadChapter, prefetchChapter } from '@/lib/chapterLoader'
import { Icon } from '@/components/ui/Icon'
import { SEO } from '@/components/seo/SEO'
import type { Chapter, Block } from '@/lib/contentTypes'

const LESSON_TAGS_RU: Record<string, string> = {
  'preface':      'предисловие',
  'introduction': 'введение',
  'pronunciation':'произношение · 8 треков',
  'day-1':        'согласные · LC1',
  'day-2':        'финальные согласные',
  'day-3':        'краткие гласные',
  'day-4':        'кластеры с อ',
  'day-5':        'пять тонов',
  'intermission': 'передышка',
  'day-6':        'высокий класс',
  'day-7':        'двойные начала',
  'day-8':        'особые согласные',
  'day-9':        'тон-маркеры',
  'preliminary':  'перед финалом',
  'last-day':     'чтение текста',
  'glossary':     'глоссарий',
}
const LESSON_TAGS_EN: Record<string, string> = {
  'preface':      'preface',
  'introduction': 'introduction',
  'pronunciation':'pronunciation · 8 tracks',
  'day-1':        'consonants · LC1',
  'day-2':        'final consonants',
  'day-3':        'short vowels',
  'day-4':        'clusters with อ',
  'day-5':        'five tones',
  'intermission': 'breather',
  'day-6':        'high class',
  'day-7':        'initial clusters',
  'day-8':        'special consonants',
  'day-9':        'tone markers',
  'preliminary':  'before finale',
  'last-day':     'reading text',
  'glossary':     'glossary',
}

const SPECIAL = new Set(['preface', 'introduction', 'pronunciation', 'intermission', 'preliminary'])

function splitTitle(title: string): { eyebrow: string | null; main: string } {
  const m = title.match(/^([^:]+):\s*(.+)$/)
  if (m) return { eyebrow: m[1].trim(), main: m[2].trim() }
  return { eyebrow: null, main: title }
}

function stripHtml(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]+>/g, '')
  const d = document.createElement('div')
  d.innerHTML = html
  return d.textContent || d.innerText || ''
}

function firstParagraph(blocks: Block[], ru: boolean): string | null {
  for (const b of blocks) {
    if (b.type === 'heading' && b.level === 1) continue
    if (b.type === 'paragraph') {
      const text = stripHtml((ru && b.htmlRu) || b.html).trim()
      if (text.length > 20) return text
    }
  }
  return null
}

function countItems(blocks: Block[]): number {
  let n = 0
  for (const b of blocks) {
    if (b.type === 'examples') n += b.items.length
    else if (b.type === 'thaiExample') n += 1
    else if (b.type === 'thaiTable') n += b.rows.length
  }
  return n
}

function countExercises(blocks: Block[]): number {
  return blocks.filter((b) => b.type === 'exercise').length
}

function collectSections(blocks: Block[], ru: boolean): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = []
  for (const b of blocks) {
    if (b.type === 'heading' && b.level === 2) {
      const text = (ru && b.textRu) || b.text
      const id = text.toLowerCase().replace(/[^\wЀ-ӿ฀-๿]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'section'
      out.push({ id, label: text })
    }
  }
  return out
}

export function ChapterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const slug = location.pathname.replace(/^\/+/, '').replace(/\/+$/, '')
  const { i18n } = useTranslation()
  const ru = i18n.language === 'ru'
  const setLastChapter = useProgressStore((s) => s.setLastChapter)

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSec, setActiveSec] = useState<string | null>(null)

  const meta = getChapterBySlug(slug)
  const { prev, next } = getAdjacentChapters(slug)

  useEffect(() => {
    const m = slug.match(/^appendix-(i{1,3}|iv|v)$/i)
    if (m) {
      navigate('/appendix/' + m[1].toLowerCase(), { replace: true })
    }
  }, [slug, navigate])

  useEffect(() => {
    if (!slug) return
    setLastChapter(slug)
    setLoading(true)
    setChapter(null)
    window.scrollTo(0, 0)
    let cancelled = false
    loadChapter(slug)
      .then((data) => { if (!cancelled) { setChapter(data); setLoading(false) } })
      .catch(() => { if (!cancelled) { setChapter(null); setLoading(false) } })
    return () => { cancelled = true }
  }, [slug, setLastChapter])

  useEffect(() => {
    if (next?.slug) {
      const id = window.setTimeout(() => prefetchChapter(next.slug), 600)
      return () => window.clearTimeout(id)
    }
  }, [next?.slug])

  const sections = useMemo(
    () => (chapter ? collectSections(chapter.blocks, ru) : []),
    [chapter, ru],
  )

  useEffect(() => {
    if (!sections.length) return
    const onScroll = () => {
      let cur = sections[0]?.id ?? null
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (!el) continue
        if (el.getBoundingClientRect().top < 140) cur = s.id
      }
      setActiveSec(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])

  if (!meta) {
    return (
      <div className="lesson-view fade-in">
        <SEO
          title={ru ? 'Страница не найдена — Читай по-тайски' : 'Not found — Read Thai'}
          description={ru ? 'Такой главы нет. Вернитесь к оглавлению.' : 'No such chapter. Back to contents.'}
          path={'/' + slug}
          ogImage="/og/default.png"
          locale={ru ? 'ru' : 'en'}
          type="website"
        />
        <div className="lv-eyebrow"><span>{ru ? 'не найдено' : 'not found'}</span></div>
        <h1 className="lv-title">{ru ? 'Глава не найдена' : 'Chapter not found'}</h1>
        <p className="lv-deck">
          {ru ? 'Похоже, такой главы нет. Вернёмся к оглавлению.' : 'No such chapter. Back to contents.'}
        </p>
        <button type="button" className="btn" onClick={() => navigate('/')}>
          <Icon name="arrowL" size={13} /> {ru ? 'к оглавлению' : 'to contents'}
        </button>
      </div>
    )
  }

  const title = ru ? meta.titleRu : meta.titleEn
  const { eyebrow: titleEyebrow, main: titleMain } = splitTitle(title)
  const tag = (ru ? LESSON_TAGS_RU[slug] : LESSON_TAGS_EN[slug]) || (ru ? 'глава' : 'chapter')
  const day = titleEyebrow || (ru ? 'глава' : 'chapter')

  const deck = chapter ? firstParagraph(chapter.blocks, ru) : null
  const itemsCount = chapter ? countItems(chapter.blocks) : 0
  const exerciseCount = chapter ? countExercises(chapter.blocks) : 0
  const minutes = Math.max(8, meta.tracks.length * 3 + (chapter?.blocks.length ?? 0) > 30 ? 22 : 14)

  const ogSlug = slug.replace(/\//g, '-')
  const firstTrack = meta.tracks[0]
  const audioUrl = firstTrack ? `${import.meta.env.BASE_URL}audio/${String(firstTrack).padStart(3, '0')}.mp3` : undefined
  const seoTitle = `${ru ? meta.titleRu : meta.titleEn} — ${ru ? 'Читай по-тайски за 10 дней' : 'Read Thai in 10 Days'}`
  const seoDesc = (deck && deck.length > 30)
    ? deck.replace(/\s+/g, ' ').trim().slice(0, 200)
    : (ru
      ? 'Глава учебника «Читай по-тайски за 10 дней». Тайское письмо, аудио, упражнения.'
      : 'Chapter from "Read Thai in 10 Days". Thai script, audio, drills.')

  return (
    <div className="lesson-view fade-in">
      <SEO
        title={seoTitle}
        description={seoDesc}
        path={'/' + slug}
        ogImage={`/og/${ogSlug}.png`}
        locale={ru ? 'ru' : 'en'}
        type="article"
        audio={audioUrl}
        publishedTime="2014-10-21T00:00:00Z"
        modifiedTime="2026-05-16T00:00:00Z"
      />
      <div className="lv-eyebrow">
        <span>{tag}</span>
        <span className="day">— {day}</span>
      </div>
      <h1 className="lv-title">
        {SPECIAL.has(slug) || !titleEyebrow ? titleMain : <>{titleMain.split(' ').map((w, i, arr) => (
          i === arr.length - 1 ? <em key={i}>{w}</em> : <span key={i}>{w} </span>
        ))}</>}
      </h1>
      {deck && <p className="lv-deck">{deck}</p>}
      <div className="lv-meta">
        <span>≈ <b>{minutes} {ru ? 'минут' : 'min'}</b></span>
        {meta.tracks.length > 0 && <span><b>{meta.tracks.length}</b> {ru ? 'аудио‑треков' : 'audio tracks'}</span>}
        {itemsCount > 0 && <span><b>{itemsCount}</b> {ru ? 'символов' : 'items'}</span>}
        {exerciseCount > 0 && <span><b>{exerciseCount}</b> {ru ? 'упражнений' : 'exercises'}</span>}
      </div>

      <article className="prose">
        {loading && (
          <p style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>
            {ru ? 'Загружаем главу…' : 'Loading chapter…'}
          </p>
        )}
        {chapter && <ContentRenderer chapter={chapter} skipDeckText={deck} />}
        {!loading && !chapter && (
          <p>{ru ? 'Эта глава пока готовится.' : 'This chapter is being prepared.'}</p>
        )}

        {next && (
          <div className="next-up">
            <div>
              <div className="nlabel">{ru ? 'Далее' : 'Next'}</div>
              <div className="nt">
                {(ru ? next.titleRu : next.titleEn).includes(':') ? (
                  <>
                    {splitTitle(ru ? next.titleRu : next.titleEn).eyebrow} ·{' '}
                    <em>{splitTitle(ru ? next.titleRu : next.titleEn).main}</em>
                  </>
                ) : (
                  <em>{ru ? next.titleRu : next.titleEn}</em>
                )}
              </div>
            </div>
            <button type="button" className="btn" onClick={() => navigate('/' + next.slug)}>
              {ru ? 'Открыть' : 'Open'} <Icon name="arrow" size={13} />
            </button>
          </div>
        )}

        <nav className="chapter-nav">
          {prev ? (
            <button type="button" className="cn-card cn-prev" onClick={() => navigate('/' + prev.slug)}>
              <span className="cn-label"><Icon name="arrowL" size={11} /> {ru ? 'Предыдущая' : 'Previous'}</span>
              <span className="cn-title">{ru ? prev.titleRu : prev.titleEn}</span>
            </button>
          ) : <span className="cn-spacer" aria-hidden="true" />}
          <button type="button" className="cn-card cn-home" onClick={() => navigate('/')}>
            <span className="cn-label">{ru ? 'Оглавление' : 'Contents'}</span>
            <span className="cn-title">{ru ? 'Все главы' : 'All chapters'}</span>
          </button>
          {next ? (
            <button type="button" className="cn-card cn-next" onClick={() => navigate('/' + next.slug)}>
              <span className="cn-label">{ru ? 'Следующая' : 'Next'} <Icon name="arrow" size={11} /></span>
              <span className="cn-title">{ru ? next.titleRu : next.titleEn}</span>
            </button>
          ) : <span className="cn-spacer" aria-hidden="true" />}
        </nav>
      </article>

      {sections.length > 0 && (
        <aside className="toc">
          <div className="toc-label">{ru ? 'в этой главе' : 'in this chapter'}</div>
          {sections.map((s) => (
            <a
              key={s.id}
              className={activeSec === s.id ? 'active' : ''}
              onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              {s.label}
            </a>
          ))}
        </aside>
      )}
    </div>
  )
}
