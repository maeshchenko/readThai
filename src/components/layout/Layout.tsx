import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { chapters, type ChapterMeta } from '@/lib/chapters'
import { useProgressStore } from '@/lib/stores'
import { useApplyPalette, useApplyThaiSize } from '@/lib/tweaks'
import { AudioController } from '@/components/audio/AudioController'
import { TweaksPanel } from '@/components/tweaks/TweaksPanel'
import { Brand } from './Brand'
import { NavItem } from './NavItem'
import { ProgressCard } from './ProgressCard'
import { Crumbs } from './Crumbs'
import { LangSwitcher } from './LangSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { Icon } from '@/components/ui/Icon'

const PROLOGUE_SLUGS = ['preface', 'introduction', 'pronunciation']
const REFERENCE_SLUGS = ['appendix/i', 'appendix/ii', 'appendix/iii', 'appendix/iv', 'appendix/v', 'glossary']
const LESSON_SLUGS = [
  'day-1', 'day-2', 'day-3', 'day-4', 'day-5',
  'intermission',
  'day-6', 'day-7', 'day-8', 'day-9',
  'preliminary',
  'last-day',
]
const SPECIAL = new Set(['intermission', 'preliminary'])

const ROMAN = ['I', 'II', 'III', 'IV', 'V']

function chapterPath(slug: string): string {
  return '/' + slug
}

function currentSlug(pathname: string): string {
  return pathname.replace(/^\/+/, '').replace(/\/+$/, '')
}

export function Layout() {
  useApplyPalette()
  useApplyThaiSize()

  const navigate = useNavigate()
  const location = useLocation()
  const { i18n } = useTranslation()
  const ru = i18n.language === 'ru'
  const [menuOpen, setMenuOpen] = useState(false)
  const listened = useProgressStore((s) => s.listenedTracks)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const lookup = useMemo(() => {
    const m = new Map<string, ChapterMeta>()
    for (const c of chapters) m.set(c.slug, c)
    return m
  }, [])

  const prologueItems = PROLOGUE_SLUGS.map((s) => lookup.get(s)).filter(Boolean) as ChapterMeta[]
  const lessonItems = LESSON_SLUGS.map((s) => lookup.get(s)).filter(Boolean) as ChapterMeta[]
  const referenceItems = REFERENCE_SLUGS.map((s) => lookup.get(s)).filter(Boolean) as ChapterMeta[]

  const slug = currentSlug(location.pathname)
  const activeChapter = lookup.get(slug)

  const crumbs = useMemo(() => {
    const root = { label: ru ? 'Читальня' : 'Reading Room', to: '/' }
    if (location.pathname === '/' || !activeChapter) {
      return [root, { label: ru ? 'Оглавление' : 'Contents' }]
    }
    const title = { label: ru ? activeChapter.titleRu : activeChapter.titleEn }
    if (PROLOGUE_SLUGS.includes(activeChapter.slug)) {
      return [root, { label: ru ? 'Начало' : 'Start', to: '/' }, title]
    }
    if (REFERENCE_SLUGS.includes(activeChapter.slug)) {
      return [root, { label: ru ? 'Справочник' : 'Reference', to: '/' }, title]
    }
    return [root, { label: ru ? 'Уроки' : 'Lessons', to: '/' }, title]
  }, [activeChapter, location.pathname, ru])

  const isDone = (c: ChapterMeta) => c.tracks.length > 0 && c.tracks.every((n) => listened.has(n))

  let lessonCounter = 0
  const lessonsWithNum = lessonItems.map((c) => {
    if (SPECIAL.has(c.slug)) return { chapter: c, num: null as number | null, special: true }
    lessonCounter += 1
    return { chapter: c, num: lessonCounter, special: false }
  })

  return (
    <>
      <AudioController />
      <div
        className={`rail-overlay ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <div className="app">
        <aside className={`rail ${menuOpen ? 'open' : ''}`}>
          <Brand />
          <div className="nav-group">
            <div className="nav-label">{ru ? 'Начало' : 'Start'}</div>
            {prologueItems.map((c) => (
              <NavItem
                key={c.id}
                active={slug === c.slug}
                done={isDone(c)}
                onClick={() => navigate(chapterPath(c.slug))}
              >
                {ru ? c.titleRu.replace(/^Гид по /, 'Гид по ') : c.titleEn}
              </NavItem>
            ))}
          </div>
          <div className="nav-group">
            <div className="nav-label">{ru ? 'Уроки' : 'Lessons'}</div>
            {lessonsWithNum.map(({ chapter: c, num, special }) => {
              const title = special
                ? (ru ? c.titleRu : c.titleEn)
                : (ru ? c.titleRu : c.titleEn)
              return (
                <NavItem
                  key={c.id}
                  active={slug === c.slug}
                  done={isDone(c)}
                  num={num}
                  onClick={() => navigate(chapterPath(c.slug))}
                >
                  {title}
                </NavItem>
              )
            })}
          </div>
          <div className="nav-group">
            <div className="nav-label">{ru ? 'Справочник' : 'Reference'}</div>
            {referenceItems.map((c, i) => {
              const isGlossary = c.slug === 'glossary'
              const label = isGlossary
                ? (ru ? c.titleRu : c.titleEn)
                : (ru ? 'Приложение ' : 'Appendix ') + (ROMAN[i] || '?') + ': ' + (ru ? stripPrefix(c.titleRu) : stripPrefix(c.titleEn))
              return (
                <NavItem
                  key={c.id}
                  active={slug === c.slug}
                  onClick={() => navigate(chapterPath(c.slug))}
                >
                  {label}
                </NavItem>
              )
            })}
          </div>
          <ProgressCard />
        </aside>

        <main className="main">
          <div className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                type="button"
                className="icon-btn menu-toggle"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
              >
                <Icon name={menuOpen ? 'close' : 'menu'} size={18} />
              </button>
              <Crumbs items={crumbs} />
            </div>
            <div className="top-actions">
              <LangSwitcher />
              <ThemeToggle />
              <button
                type="button"
                className="icon-btn"
                onClick={() => navigate('/')}
                title={ru ? 'Главная' : 'Home'}
                aria-label="Home"
              >
                <Icon name="home" />
              </button>
            </div>
          </div>
          <Outlet />
          <footer className="site-footer">
            <div className="sf-row">
              <span>Made with <span className="heart">♥</span> in Thailand</span>
              <span>{ru ? 'второе издание' : 'second edition'} · 2026</span>
            </div>
            <div className="sf-colophon">
              <span>
                {ru ? 'Перевод и адаптация' : 'Translation & adaptation'} · Mikhail Eshchenko
              </span>
              <span>
                {ru ? 'По мотивам' : 'Based on'} <em>«Read Thai in 10 Days»</em> {ru ? 'by' : 'by'} Tim Hughes ·{' '}
                <a
                  href="https://www.amazon.com/Read-Thai-10-Days-English/dp/1505679524"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ru ? 'купить оригинал' : 'buy original'}
                </a>
              </span>
              <span className="sf-disclaimer">
                {ru
                  ? 'Некоммерческий учебный проект. Все права на оригинальный текст принадлежат автору.'
                  : 'Non-commercial educational project. All rights to the original text belong to the author.'}
              </span>
            </div>
          </footer>
        </main>
      </div>
      {false && <TweaksPanel />}
    </>
  )
}

function stripPrefix(title: string): string {
  return title.replace(/^Приложение [IVX]+:\s*/, '').replace(/^Appendix [IVX]+:\s*/, '')
}
