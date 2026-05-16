import { Ring } from '@/components/layout/Ring'
import type { ChapterMeta } from '@/lib/chapters'

interface Props {
  chapter: ChapterMeta
  idx: number | '✦'
  tag: string
  done: number
  pct: number
  onClick: () => void
  ru: boolean
}

export function LessonCard({ chapter, idx, tag, done, pct, onClick, ru }: Props) {
  const total = chapter.tracks.length
  const isDone = total > 0 && done === total
  const active = total > 0 && done > 0 && !isDone
  const title = ru ? chapter.titleRu : chapter.titleEn

  const stripped = title.replace(/^(День \d+:|Day \d+:|Приложение [IVX]+:|Appendix [IVX]+:|Последний день:|Last Day:)\s*/, '')

  return (
    <button
      type="button"
      className={`lesson ${isDone ? 'done' : ''} ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="l-num">{typeof idx === 'number' ? String(idx).padStart(2, '0') : idx}</span>
      <div className="l-content">
        <div className="l-tag">— {tag}</div>
        <div className="l-title">{stripped}</div>
        <div className="l-meta">
          {total > 0 ? (
            <>
              <span>{total} {ru ? pluralRu(total, 'трек', 'трека', 'треков') : `track${total === 1 ? '' : 's'}`}</span>
              <span className="dot" />
              <span>{done}/{total}{ru ? ' прослушано' : ' listened'}</span>
            </>
          ) : (
            <span>{ru ? 'чтение без аудио' : 'reading only'}</span>
          )}
          {isDone && (
            <>
              <span className="dot" />
              <span style={{ color: 'var(--sage)' }}>{ru ? 'пройдено' : 'done'}</span>
            </>
          )}
        </div>
      </div>
      <Ring value={pct} />
    </button>
  )
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}
