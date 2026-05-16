import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { chapters, type ChapterMeta } from '@/lib/chapters'
import { useProgressStore } from '@/lib/stores'
import { Icon } from '@/components/ui/Icon'
import { LessonCard } from '@/components/home/LessonCard'

const HERO_GLYPHS = ['ก', 'ข', 'ค', 'ง']

const LESSON_SLUGS = [
  'day-1', 'day-2', 'day-3', 'day-4', 'day-5',
  'intermission',
  'day-6', 'day-7', 'day-8', 'day-9',
  'preliminary',
  'last-day',
]
const REFERENCE_SLUGS = ['appendix/i', 'appendix/ii', 'appendix/iii', 'appendix/iv', 'appendix/v']
const ROMAN = ['I', 'II', 'III', 'IV', 'V']
const SPECIAL = new Set(['intermission', 'preliminary'])

const LESSON_TAGS_RU: Record<string, string> = {
  'day-1':       'Согласные · LC1',
  'day-2':       'Финальные согласные',
  'day-3':       'Краткие гласные',
  'day-4':       'Кластеры с อ',
  'day-5':       'Пять тонов',
  'intermission':'Передышка',
  'day-6':       'Высокий класс',
  'day-7':       'Двойные начала',
  'day-8':       'Особые согласные',
  'day-9':       'Тон-маркеры',
  'preliminary': 'Перед финалом',
  'last-day':    'Чтение текста',
}
const LESSON_TAGS_EN: Record<string, string> = {
  'day-1':       'Consonants · LC1',
  'day-2':       'Final consonants',
  'day-3':       'Short vowels',
  'day-4':       'Clusters with อ',
  'day-5':       'Five tones',
  'intermission':'Breather',
  'day-6':       'High class',
  'day-7':       'Initial clusters',
  'day-8':       'Special consonants',
  'day-9':       'Tone markers',
  'preliminary': 'Before finale',
  'last-day':    'Reading text',
}

export function HomePage() {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const ru = i18n.language === 'ru'
  const listened = useProgressStore((s) => s.listenedTracks)
  const lastChapter = useProgressStore((s) => s.lastChapter)

  const [glyphIdx, setGlyphIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setGlyphIdx((x) => (x + 1) % HERO_GLYPHS.length), 1700)
    return () => clearInterval(id)
  }, [])

  const lookup = useMemo(() => new Map(chapters.map((c) => [c.slug, c])), [])
  const lessons = LESSON_SLUGS.map((s) => lookup.get(s)).filter(Boolean) as ChapterMeta[]
  const refs = REFERENCE_SLUGS.map((s) => lookup.get(s)).filter(Boolean) as ChapterMeta[]

  const allTracks = chapters.flatMap((c) => c.tracks)
  const tracksTotal = allTracks.length
  const tracksHeard = allTracks.filter((n) => listened.has(n)).length

  const real = lessons.filter((c) => !SPECIAL.has(c.slug))
  const totalProgress = real.length
    ? real.reduce((acc, c) => {
        if (!c.tracks.length) return acc + 0
        const d = c.tracks.filter((n) => listened.has(n)).length / c.tracks.length
        return acc + d
      }, 0) / real.length
    : 0

  const continueChapter = lastChapter ? lookup.get(lastChapter) : null
  const continueTitle = continueChapter
    ? (ru ? continueChapter.titleRu : continueChapter.titleEn)
    : (ru ? 'День 1' : 'Day 1')
  const continueSlug = continueChapter?.slug ?? 'day-1'

  let lessonCounter = 0
  const lessonsRendered = lessons.map((c) => {
    const special = SPECIAL.has(c.slug)
    if (!special) lessonCounter += 1
    return { chapter: c, idx: special ? ('✦' as const) : lessonCounter, special }
  })

  return (
    <div className="canvas fade-in">
      <div className="hero">
        <div>
          <div className="eyebrow">
            {ru ? 'настольная книга · второе издание' : "a learner's field guide · second edition"}
          </div>
          <h1>
            {ru ? (
              <>Читай <em>по‑тайски</em><br />за 10 дней</>
            ) : (
              <>Read <em>Thai</em><br />in 10 days</>
            )}
          </h1>
          <p className="lede">
            {ru
              ? 'Десять структурированных уроков, 85 нативных аудио‑треков и упражнения с обратной связью — чтобы за две недели вы видели в тайских буквах не каракули, а слова.'
              : 'Ten structured lessons, 85 native audio tracks and feedback-driven drills — so within two weeks Thai script reads as words, not squiggles.'}
          </p>
          <div className="cta-row">
            <button type="button" className="btn" onClick={() => navigate('/' + continueSlug)}>
              <Icon name="sparkles" size={14} />
              {ru ? `Продолжить · ${shortTitle(continueTitle, ru)}` : `Continue · ${shortTitle(continueTitle, ru)}`}
              <Icon name="arrow" size={14} />
            </button>
            <button type="button" className="btn ghost" onClick={() => navigate('/pronunciation')}>
              <Icon name="headphones" size={14} />
              {ru ? 'Гид по произношению' : 'Pronunciation guide'}
            </button>
          </div>
        </div>
        <div className="hero-plate" aria-hidden="true">
          <span className="corner tl">ก · kai</span>
          <span className="corner tr">{ru ? 'mid · class' : 'mid · class'}</span>
          <span className="corner bl">low · 01</span>
          <span className="corner br">⏤ alphabet ⏤</span>
          <div className="glyph-stack">
            {HERO_GLYPHS.map((g, i) => (
              <div key={i} className={`g ${i === glyphIdx ? 'lit' : ''}`}>{g}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="meta-strip">
        <Meta label={ru ? 'всего уроков' : 'lessons'} value={String(real.length)} />
        <Meta label={ru ? 'аудио‑треков' : 'audio tracks'} value={String(tracksTotal)} />
        <Meta label={ru ? 'прослушано' : 'heard'} value={<em>{tracksHeard}</em>} />
        <Meta label={ru ? 'твой прогресс' : 'your progress'} value={<em>{Math.round(totalProgress * 100)}%</em>} />
        <Meta label={ru ? 'ориентир' : 'pace'} value={ru ? '~25 мин/день' : '~25 min/day'} />
      </div>

      <div className="sec-head">
        <h2><span className="num">§ I</span>{ru ? 'Уроки' : 'Lessons'}</h2>
        <span className="right">{ru ? `${lessons.length} глав` : `${lessons.length} chapters`}</span>
      </div>
      <div className="lessons">
        {lessonsRendered.map(({ chapter: c, idx }) => {
          const tag = ru ? LESSON_TAGS_RU[c.slug] || '' : LESSON_TAGS_EN[c.slug] || ''
          const done = c.tracks.filter((n) => listened.has(n)).length
          const pct = c.tracks.length ? done / c.tracks.length : 0
          return (
            <LessonCard
              key={c.id}
              chapter={c}
              idx={idx}
              tag={tag}
              done={done}
              pct={pct}
              onClick={() => navigate('/' + c.slug)}
              ru={ru}
            />
          )
        })}
      </div>

      <div className="sec-head">
        <h2><span className="num">§ II</span>{ru ? 'Справочник' : 'Reference'}</h2>
        <span className="right">{ru ? `${refs.length} приложений` : `${refs.length} appendices`}</span>
      </div>
      <div className="lessons">
        {refs.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className="lesson"
            onClick={() => navigate('/' + c.slug)}
          >
            <span className="l-num" style={{ fontSize: 38, paddingTop: 6 }}>{ROMAN[i] || '?'}</span>
            <div className="l-content">
              <div className="l-tag">— {ru ? 'приложение' : 'appendix'}</div>
              <div className="l-title">{stripAppendixPrefix(ru ? c.titleRu : c.titleEn)}</div>
              <div className="l-meta">
                <span>{ru ? 'сводная таблица' : 'reference table'}</span>
              </div>
            </div>
            <div style={{ alignSelf: 'center', color: 'var(--ink-3)' }}>
              <Icon name="arrow" size={14} />
            </div>
          </button>
        ))}
      </div>

      <div className="spine">
        <span>Bangkok · Mae‑Sa · Made with <span className="heart">♥</span></span>
        <span>colophon · {ru ? 'второе издание' : 'second edition'} · 2026</span>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="meta-item">
      <div className="ml">{label}</div>
      <div className="mv">{value}</div>
    </div>
  )
}

function shortTitle(title: string, ru: boolean): string {
  const m = title.match(/^(День \d+|Day \d+|Последний день|Last Day|Антракт|Intermission|Подготовка|Preliminary|Гид по произношению|Pronunciation Guide|Предисловие|Preface|Введение|Introduction|Приложение [IVX]+|Appendix [IVX]+)/)
  if (m) return m[1]
  return ru ? 'Урок' : 'Lesson'
}

function stripAppendixPrefix(s: string): string {
  return s.replace(/^Приложение [IVX]+:\s*/, '').replace(/^Appendix [IVX]+:\s*/, '')
}
