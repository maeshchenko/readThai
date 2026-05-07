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
import { motion } from 'framer-motion'

interface Props {
  blocks: Block[]
  footnotes: Record<number, string>
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

export function ContentRenderer({ blocks, footnotes }: Props) {
  const processed = preprocessBlocks(blocks)
  return (
    <div className="prose-content space-y-6">
      {processed.map((block, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.5) }}
        >
          <BlockRenderer block={block} footnotes={footnotes} />
        </motion.div>
      ))}
    </div>
  )
}

function BlockRenderer({ block, footnotes }: { block: Block; footnotes: Record<number, string> }) {
  switch (block.type) {
    case 'heading':
      return <HeadingBlock level={block.level} text={block.text} />
    case 'paragraph':
      return <p className="leading-relaxed text-[var(--color-on-surface)]" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'list':
      return block.ordered ? (
        <ol className="list-decimal space-y-1.5 pl-6 marker:text-[var(--color-on-surface-faint)]">
          {block.items.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: item }} />)}
        </ol>
      ) : (
        <ul className="list-disc space-y-1.5 pl-6 marker:text-[var(--color-on-surface-faint)]">
          {block.items.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: item }} />)}
        </ul>
      )
    case 'callout':
      return <CalloutBlock variant={block.variant} html={block.html} />
    case 'rule':
      return <RuleBlock html={block.html} emphasis={block.emphasis} eyebrow={block.eyebrow} />
    case 'examples':
      return <ExampleGroup items={block.items} layout={block.layout} eyebrow={block.eyebrow} />
    case 'track':
      return <TrackCard trackNumber={block.number} label={block.label} />
    case 'thaiExample':
      return <ThaiExample thai={block.thai} translit={block.translit} meaning={block.meaning} tone={block.tone} />
    case 'thaiTable':
      return (
        <ThaiTable
          columns={block.columns}
          rows={block.rows}
          headerRows={block.headerRows}
          stickyFirstCol={block.stickyFirstCol}
        />
      )
    case 'image':
      return <ImageBlock src={block.src} alt={block.alt} caption={block.caption} />
    case 'exercise':
      return <ExerciseBlock instruction={block.instruction} items={block.items} trackNumber={block.trackNumber} answerKey={block.answerKey} />
    case 'recap':
      return <RecapBlock items={block.items} />
    case 'divider':
      return <hr className="my-2 border-0 border-t border-[var(--color-hairline)]" />
    case 'footnoteRef':
      return (
        <aside className="rounded-2xl bg-[var(--color-surface-dim)] px-4 py-3 text-sm ring-1 ring-[var(--color-hairline)]">
          <span className="font-mono text-xs text-[var(--color-on-surface-muted)]">[{block.id}] </span>
          {footnotes[block.id] ?? ''}
        </aside>
      )
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
