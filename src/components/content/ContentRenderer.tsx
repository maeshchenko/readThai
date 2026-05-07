import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Block, ExampleItem } from '@/lib/contentTypes'
import { TrackCard } from '@/components/audio/TrackCard'
import { ThaiExample } from './ThaiExample'
import { ThaiTable } from './ThaiTable'
import { ExerciseBlock } from './ExerciseBlock'
import { RecapBlock } from './RecapBlock'
import { CalloutBlock } from './CalloutBlock'
import { ImageBlock } from './ImageBlock'
import { ExampleGroup } from './ExampleGroup'
import { RuleBlock } from './RuleBlock'

interface Props {
  blocks: Block[]
  footnotes: Record<number, string>
  footnotesRu?: Record<number, string>
}

const THAI_RE = /[\u0E00-\u0E7F]/
const PAGE_NUM_RE = /^\d{1,3}$/

function isPureThaiShort(text: string): boolean {
  const s = text.trim()
  if (!s || s.length > 40) return false
  if (!THAI_RE.test(s)) return false
  return /^[\u0E00-\u0E7F\s()\-]+$/.test(s)
}

function preprocessBlocks(blocks: Block[]): Block[] {
  const filtered: Block[] = []
  for (const b of blocks) {
    if (b.type === 'paragraph') {
      const trimmed = b.html.trim()
      if (!trimmed || PAGE_NUM_RE.test(trimmed)) continue
    }
    filtered.push(b)
  }

  const merged: Block[] = []
  let buffer: ExampleItem[] = []

  const flushBuffer = () => {
    if (buffer.length === 0) return
    if (buffer.length === 1) {
      merged.push({ type: 'paragraph', html: buffer[0].thai })
    } else {
      merged.push({ type: 'examples', layout: 'chips', items: buffer })
    }
    buffer = []
  }

  for (const b of filtered) {
    if (b.type === 'paragraph' && isPureThaiShort(b.html)) {
      buffer.push({ thai: b.html.trim() })
      continue
    }
    flushBuffer()
    merged.push(b)
  }
  flushBuffer()

  for (let i = 0; i < merged.length - 1; i++) {
    const cur = merged[i]
    const next = merged[i + 1]
    if (
      next.type === 'examples' &&
      cur.type === 'list' &&
      cur.items.length === 1 &&
      /[.:!?]\s*$/.test(cur.items[0])
    ) {
      merged[i] = { type: 'rule', html: cur.items[0], emphasis: 'soft' }
    }
  }

  return merged
}

export function ContentRenderer({ blocks, footnotes, footnotesRu }: Props) {
  const processed = preprocessBlocks(blocks)
  const { i18n } = useTranslation()
  const lang = i18n.language as 'en' | 'ru'
  return (
    <div className="prose-content space-y-6">
      {processed.map((block, i) => (
        <BlockReveal key={i} index={i}>
          <BlockRenderer block={block} footnotes={footnotes} footnotesRu={footnotesRu} lang={lang} />
        </BlockReveal>
      ))}
    </div>
  )
}

function BlockReveal({ index, children }: { index: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const eager = index < 4

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (eager) {
      el.classList.add('block-reveal-in')
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('block-reveal-in')
            obs.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [eager])

  return (
    <div ref={ref} className="block-reveal" data-eager={eager ? '' : undefined}>
      {children}
      <style>{`
        .block-reveal {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 320ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
          will-change: opacity, transform;
        }
        .block-reveal-in {
          opacity: 1;
          transform: translateY(0);
        }
        .block-reveal[data-eager] {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .block-reveal { opacity: 1; transform: none; transition: none; }
        }
      `}</style>
    </div>
  )
}

function BlockRenderer({ block, footnotes, footnotesRu, lang }: { block: Block; footnotes: Record<number, string>; footnotesRu?: Record<number, string>; lang: 'en' | 'ru' }) {
  const ru = lang === 'ru'
  switch (block.type) {
    case 'heading':
      return <HeadingBlock level={block.level} text={(ru && block.textRu) || block.text} />
    case 'paragraph':
      return <p className="leading-relaxed text-[var(--color-on-surface)]" dangerouslySetInnerHTML={{ __html: (ru && block.htmlRu) || block.html }} />
    case 'list': {
      const items = (ru && block.itemsRu) || block.items
      return block.ordered ? (
        <ol className="list-decimal space-y-1.5 pl-6 marker:text-[var(--color-on-surface-faint)]">
          {items.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: item }} />)}
        </ol>
      ) : (
        <ul className="list-disc space-y-1.5 pl-6 marker:text-[var(--color-on-surface-faint)]">
          {items.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: item }} />)}
        </ul>
      )
    }
    case 'callout':
      return <CalloutBlock variant={block.variant} html={(ru && block.htmlRu) || block.html} />
    case 'rule':
      return <RuleBlock html={(ru && block.htmlRu) || block.html} emphasis={block.emphasis} eyebrow={block.eyebrow} />
    case 'examples':
      return <ExampleGroup items={block.items} layout={block.layout} eyebrow={block.eyebrow} lang={lang} />
    case 'track':
      return <TrackCard trackNumber={block.number} label={block.label} />
    case 'thaiExample':
      return <ThaiExample thai={block.thai} translit={block.translit} meaning={(ru && block.meaningRu) || block.meaning} tone={block.tone} />
    case 'thaiTable':
      return (
        <ThaiTable
          columns={(ru && block.columnsRu) || block.columns}
          rows={block.rows}
          headerRows={block.headerRows}
          stickyFirstCol={block.stickyFirstCol}
          lang={lang}
        />
      )
    case 'image':
      return <ImageBlock src={block.src} alt={block.alt} caption={(ru && block.captionRu) || block.caption} />
    case 'exercise':
      return <ExerciseBlock instruction={(ru && block.instructionRu) || block.instruction} items={block.items} trackNumber={block.trackNumber} answerKey={(ru && block.answerKeyRu) || block.answerKey} />
    case 'recap':
      return <RecapBlock items={(ru && block.itemsRu) || block.items} />
    case 'divider':
      return <hr className="my-2 border-0 border-t border-[var(--color-hairline)]" />
    case 'footnoteRef': {
      const fn = (ru && footnotesRu?.[block.id]) || footnotes[block.id] || ''
      return (
        <aside className="rounded-2xl bg-[var(--color-surface-dim)] px-4 py-3 text-sm ring-1 ring-[var(--color-hairline)]">
          <span className="font-mono text-xs text-[var(--color-on-surface-muted)]">[{block.id}] </span>
          {fn}
        </aside>
      )
    }
    default:
      return null
  }
}

function HeadingBlock({ level, text }: { level: 1 | 2 | 3; text: string }) {
  const Tag = `h${level}` as const
  const classes = {
    1: 'text-3xl md:text-4xl font-bold mt-12 mb-5 tracking-tight text-balance',
    2: 'text-2xl md:text-[1.625rem] font-semibold mt-10 mb-4 tracking-tight text-balance',
    3: 'text-lg md:text-xl font-semibold mt-7 mb-3 tracking-tight text-balance',
  }
  return <Tag className={classes[level]}>{text}</Tag>
}
