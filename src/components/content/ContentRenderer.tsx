import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Block, ExampleItem, Chapter } from '@/lib/contentTypes'
import { useTweaks } from '@/lib/tweaks'
import { CharGrid, type CharItem } from './CharGrid'
import { SyllableTryIt, type SylItem } from './SyllableTryIt'
import { Player } from './Player'
import { RefTable } from './RefTable'
import { Flashcards, type DeckItem } from './Flashcards'
import { MultiChoice, type MCItem } from './MultiChoice'
import { VoiceTrainer } from '@/components/practice/VoiceTrainer'

interface Props {
  chapter: Chapter
}

const THAI_RE = /[฀-๿]/
const PAGE_NUM_RE = /^\d{1,3}$/

function isPureThaiShort(text: string): boolean {
  const s = text.trim()
  if (!s || s.length > 40) return false
  if (!THAI_RE.test(s)) return false
  return /^[฀-๿\s()\-*]+$/.test(s)
}

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[^\wЀ-ӿ฀-๿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'section'
}

function adjacentTrackNumber(blocks: Block[], idx: number): number | undefined {
  for (let j = Math.max(0, idx - 2); j <= Math.min(blocks.length - 1, idx + 2); j++) {
    if (j === idx) continue
    const b = blocks[j]
    if (b.type === 'track') return b.number
  }
  return undefined
}

function preprocess(blocks: Block[]): Block[] {
  const filtered: Block[] = []
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    if (i === 0 && b.type === 'heading' && b.level === 1) continue
    if (b.type === 'heading' && b.level === 1) continue
    if (b.type === 'paragraph') {
      const s = b.html.trim()
      if (!s || PAGE_NUM_RE.test(s)) continue
    }
    filtered.push(b)
  }

  // Merge consecutive thai-only paragraphs into examples (chips)
  const merged: Block[] = []
  let buf: ExampleItem[] = []
  const flush = () => {
    if (!buf.length) return
    if (buf.length === 1) merged.push({ type: 'paragraph', html: buf[0].thai })
    else merged.push({ type: 'examples', layout: 'chips', items: buf })
    buf = []
  }
  for (const b of filtered) {
    if (b.type === 'paragraph' && isPureThaiShort(b.html)) {
      buf.push({ thai: b.html.trim() })
      continue
    }
    flush()
    merged.push(b)
  }
  flush()
  return merged
}

function collectDeck(blocks: Block[]): DeckItem[] {
  const out: DeckItem[] = []
  const seen = new Set<string>()
  const add = (glyph: string, ipa?: string, name?: string, ru?: string) => {
    const g = glyph.trim()
    if (!g || !THAI_RE.test(g) || g.length > 16) return
    if (seen.has(g)) return
    seen.add(g)
    out.push({ glyph: g, ipa, name, ru })
  }
  for (const b of blocks) {
    if (b.type === 'thaiExample') add(b.thai, b.translit, b.meaning, b.meaningRu)
    else if (b.type === 'examples') {
      for (const it of b.items) add(it.thai, it.translit, it.meaning, it.meaningRu)
    } else if (b.type === 'thaiTable') {
      for (const r of b.rows) add(r.thai, r.translit, r.meaning, r.meaningRu)
    }
  }
  return out.filter((d) => d.ipa)
}

function buildMC(deck: DeckItem[]): MCItem[] {
  if (deck.length < 4) return []
  return deck.map((d, i) => {
    const others = deck.filter((_, j) => j !== i && deck[j].ipa).map((x) => x.ipa!) as string[]
    const distractors: string[] = []
    while (distractors.length < 3 && others.length) {
      const r = Math.floor(Math.random() * others.length)
      const pick = others[r]
      others.splice(r, 1)
      if (pick && pick !== d.ipa) distractors.push(pick)
    }
    return { glyph: d.glyph, correct: d.ipa!, distractors }
  })
}

export function ContentRenderer({ chapter }: Props) {
  const { i18n } = useTranslation()
  const lang = i18n.language as 'en' | 'ru'
  const ru = lang === 'ru'
  const exerciseStyle = useTweaks((s) => s.exerciseStyle)
  const blocks = useMemo(() => preprocess(chapter.blocks), [chapter.blocks])
  const deck = useMemo(() => collectDeck(blocks), [blocks])
  const mc = useMemo(() => buildMC(deck), [deck])

  let sectionCounter = 0
  let firstParaSeen = false
  let voiceTrainerInjected = false
  let firstTrackSeen = false

  return (
    <Fragment>
      {blocks.map((b, i) => {
        const renderTrainerAfter = !voiceTrainerInjected && firstTrackSeen
        if (renderTrainerAfter) {
          voiceTrainerInjected = true
        }
        const block = (() => {
          switch (b.type) {
            case 'heading': {
              if (b.level === 2) {
                sectionCounter += 1
                firstParaSeen = false
                const text = (ru && b.textRu) || b.text
                const id = slugify(text)
                return (
                  <h3 id={id} key={i}>
                    <span className="secnum">§ {sectionCounter}</span>
                    {text}
                  </h3>
                )
              }
              if (b.level === 3) {
                const text = (ru && b.textRu) || b.text
                return <h4 key={i}>{text}</h4>
              }
              return null
            }
            case 'paragraph': {
              const html = (ru && b.htmlRu) || b.html
              const cls = firstParaSeen ? '' : 'drop'
              firstParaSeen = true
              return <p key={i} className={cls} dangerouslySetInnerHTML={{ __html: html }} />
            }
            case 'list': {
              const items = (ru && b.itemsRu) || b.items
              const Tag = b.ordered ? 'ol' : 'ul'
              return (
                <Tag key={i}>
                  {items.map((it, j) => (
                    <li key={j} dangerouslySetInnerHTML={{ __html: it }} />
                  ))}
                </Tag>
              )
            }
            case 'callout':
              return (
                <blockquote key={i} className="note">
                  <span className="eyebrow-inline">{calloutLabel(b.variant, ru)}</span>
                  <span dangerouslySetInnerHTML={{ __html: (ru && b.htmlRu) || b.html }} />
                </blockquote>
              )
            case 'rule':
              return (
                <blockquote key={i} className="note">
                  {b.eyebrow && <span className="eyebrow-inline">{b.eyebrow}</span>}
                  <span dangerouslySetInnerHTML={{ __html: (ru && b.htmlRu) || b.html }} />
                </blockquote>
              )
            case 'track': {
              firstTrackSeen = true
              return (
                <Player
                  key={i}
                  trackNumber={b.number}
                  label={b.label || (ru ? `Трек ${b.number}` : `Track ${b.number}`)}
                  chapterSlug={chapter.slug}
                  chapterTitle={ru ? chapter.titleRu : chapter.titleEn}
                />
              )
            }
            case 'examples': {
              const layout = b.layout || 'chips'
              if (layout === 'inline') {
                return (
                  <p key={i}>
                    {b.items.map((it, j) => (
                      <Fragment key={j}>
                        <span className="thai-inline">{it.thai}</span>
                        {it.translit && <span> [{it.translit}]</span>}
                        {it.meaning && <span> — {(ru && it.meaningRu) || it.meaning}</span>}
                        {j < b.items.length - 1 && '; '}
                      </Fragment>
                    ))}
                  </p>
                )
              }
              if (layout === 'grid') {
                const items: CharItem[] = b.items.map((it) => ({
                  glyph: it.thai,
                  ipa: it.translit,
                  name: (ru && it.meaningRu) || it.meaning,
                }))
                return (
                  <CharGrid
                    key={i}
                    items={items}
                    columns={items.length > 8 ? 7 : items.length}
                    trackNumber={adjacentTrackNumber(blocks, i)}
                    chapterSlug={chapter.slug}
                    chapterTitle={ru ? chapter.titleRu : chapter.titleEn}
                  />
                )
              }
              // chips → syllable try-it
              const sylItems: SylItem[] = b.items.map((it) => ({
                glyph: it.thai,
                ipa: it.translit,
                ru: (ru && it.meaningRu) || it.meaning,
              }))
              return <SyllableTryIt key={i} items={sylItems} />
            }
            case 'thaiExample': {
              const items: CharItem[] = [{
                glyph: b.thai,
                ipa: b.translit,
                name: (ru && b.meaningRu) || b.meaning,
              }]
              return (
                <CharGrid
                  key={i}
                  items={items}
                  columns={1}
                  trackNumber={adjacentTrackNumber(blocks, i)}
                  chapterSlug={chapter.slug}
                  chapterTitle={ru ? chapter.titleRu : chapter.titleEn}
                />
              )
            }
            case 'thaiTable':
              return (
                <RefTable
                  key={i}
                  columns={(ru && b.columnsRu) || b.columns}
                  rows={b.rows}
                  headerRows={b.headerRows}
                  lang={lang}
                />
              )
            case 'image': {
              const src = `${import.meta.env.BASE_URL}${b.src.replace(/^\//, '')}`
              const caption = (ru && b.captionRu) || b.caption
              return (
                <figure key={i} className="book-figure">
                  <img src={src} alt={b.alt} loading="lazy" />
                  {caption && <figcaption>{caption}</figcaption>}
                </figure>
              )
            }
            case 'exercise': {
              const items: DeckItem[] = b.items.map((it, j) => ({
                glyph: it,
                ipa: extractItemIpa(b.answerKey, j),
                name: '',
                ru: '',
              })).filter((d) => d.glyph)
              return (
                <div key={i} className="tryit">
                  <div className="ti-eyebrow">{ru ? 'Попробуйте' : 'Try it'}</div>
                  <h4>{(ru && b.instructionRu) || b.instruction}</h4>
                  <p className="ti-deck">
                    {ru
                      ? 'Сначала прочтите вслух, потом сверьтесь с ответом.'
                      : 'Read aloud first, then check the answer.'}
                  </p>
                  {b.trackNumber != null && (
                    <Player
                      trackNumber={b.trackNumber}
                      label={ru ? `Трек ${b.trackNumber}` : `Track ${b.trackNumber}`}
                      chapterSlug={chapter.slug}
                      chapterTitle={ru ? chapter.titleRu : chapter.titleEn}
                    />
                  )}
                  {items.length >= 4 ? (
                    <SyllableTryIt items={items.map((d) => ({ glyph: d.glyph, ipa: d.ipa, ru: d.ru }))} />
                  ) : (
                    <AnswerKey ru={ru} text={(ru && b.answerKeyRu) || b.answerKey} />
                  )}
                </div>
              )
            }
            case 'recap': {
              const items = (ru && b.itemsRu) || b.items
              return (
                <div key={i} className="summary">
                  <div className="stamp">✦ {ru ? 'итоги дня' : 'today’s recap'} · {items.length} {ru ? 'пунктов' : 'points'}</div>
                  <h4>{ru ? 'Что вы запомнили сегодня' : 'What you’ve learned today'}</h4>
                  <ul>
                    {items.map((it, j) => (
                      <li key={j} dangerouslySetInnerHTML={{ __html: it }} />
                    ))}
                  </ul>
                </div>
              )
            }
            case 'preview': {
              const html = (ru && b.htmlRu) || b.html
              return (
                <div key={i} className="next-up">
                  <div>
                    <div className="nlabel">{ru ? 'Завтра' : 'Tomorrow'}</div>
                    <div className="nt" dangerouslySetInnerHTML={{ __html: html }} />
                  </div>
                </div>
              )
            }
            case 'divider':
              return <hr key={i} className="rule" />
            case 'footnoteRef': {
              const fn = (ru && chapter.footnotesRu?.[b.id]) || chapter.footnotes[b.id] || ''
              return (
                <FootnoteInline key={i} id={b.id} text={fn} />
              )
            }
            default:
              return null
          }
        })()

        if (renderTrainerAfter) {
          const firstTrackNum = blocks.find((x) => x.type === 'track' && 'number' in x) as
            | { number: number } | undefined
          return (
            <Fragment key={`fr-${i}`}>
              {block}
              <div className="practice-row">
                <VoiceTrainer
                  sampleTrackNumber={firstTrackNum?.number}
                  chapterSlug={chapter.slug}
                  chapterTitle={ru ? chapter.titleRu : chapter.titleEn}
                />
              </div>
            </Fragment>
          )
        }
        return block
      })}

      {/* Auto deck at end of chapter */}
      {deck.length >= 4 && (
        <div className="tryit">
          <div className="ti-eyebrow">{ru ? 'Тренировка' : 'Drill'}</div>
          <h4>
            {exerciseStyle === 'multichoice'
              ? (ru ? 'Выбор из вариантов' : 'Multiple choice')
              : (ru ? 'Карточки‑перевёртыши' : 'Flip cards')}
          </h4>
          <p className="ti-deck">
            {exerciseStyle === 'multichoice'
              ? (ru ? 'Послушайте звук — выберите верный.' : 'Hear the sound — pick the match.')
              : (ru ? 'Нажмите карточку, чтобы перевернуть. Оцените себя: снова · сложно · хорошо · легко.' : 'Tap to flip. Rate yourself: again · hard · good · easy.')}
          </p>
          {exerciseStyle === 'multichoice'
            ? <MultiChoice items={mc} />
            : <Flashcards items={deck} />}
        </div>
      )}
    </Fragment>
  )
}

function calloutLabel(variant: 'tip' | 'warning' | 'note', ru: boolean): string {
  if (variant === 'tip') return ru ? 'Подсказка' : 'Tip'
  if (variant === 'warning') return ru ? 'Внимание' : 'Heads up'
  return ru ? 'Примечание' : 'Note'
}

function extractItemIpa(_answer: string | undefined, _idx: number): string | undefined {
  return undefined
}

function FootnoteInline({ id, text }: { id: number; text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ display: 'inline' }}>
      <sup
        style={{ color: 'var(--accent)', cursor: 'pointer', marginLeft: 2, fontFamily: 'var(--mono)' }}
        onClick={() => setOpen((v) => !v)}
      >
        [{id}]
      </sup>
      {open && (
        <span
          style={{
            display: 'block',
            marginTop: 8,
            padding: '10px 14px',
            border: '1px solid var(--rule)',
            background: 'var(--paper-2)',
            borderRadius: 4,
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--ink-2)',
          }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      )}
    </span>
  )
}

function AnswerKey({ ru, text }: { ru: boolean; text: string | undefined }) {
  const [open, setOpen] = useState(false)
  if (!text) return null
  return (
    <div style={{ marginTop: 12 }}>
      <button type="button" className="pill-btn" onClick={() => setOpen((v) => !v)}>
        {open ? (ru ? 'скрыть ответ' : 'hide answer') : (ru ? 'показать ответ' : 'show answer')}
      </button>
      {open && (
        <div
          style={{
            marginTop: 12,
            padding: '14px 16px',
            border: '1px solid var(--rule)',
            background: 'var(--paper)',
            borderRadius: 4,
            fontFamily: 'var(--serif)',
            fontSize: 16,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
          }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      )}
    </div>
  )
}
