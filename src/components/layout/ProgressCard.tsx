import { useTranslation } from 'react-i18next'
import { useProgressStore } from '@/lib/stores'
import { chapters } from '@/lib/chapters'

export function ProgressCard() {
  const listened = useProgressStore((s) => s.listenedTracks)
  const { i18n } = useTranslation()
  const ru = i18n.language === 'ru'

  const allTracks = chapters.flatMap((c) => c.tracks)
  const total = allTracks.length
  const done = allTracks.filter((n) => listened.has(n)).length
  const pct = total ? Math.round((done / total) * 100) : 0

  const activeLessons = chapters.filter((c) => {
    if (!c.tracks.length) return false
    const heard = c.tracks.filter((n) => listened.has(n)).length
    return heard > 0 && heard < c.tracks.length
  }).length

  return (
    <div className="progress-card">
      <div className="pc-label">{ru ? 'Твой путь' : 'Your path'}</div>
      <div className="pc-num"><em>{pct}%</em></div>
      <div className="pc-sub">
        {ru
          ? `${done} из ${total} треков · ${activeLessons} ${pluralRu(activeLessons, 'урок', 'урока', 'уроков')} в работе`
          : `${done} of ${total} tracks · ${activeLessons} lesson${activeLessons === 1 ? '' : 's'} in progress`}
      </div>
      <div className="progress-bar"><div style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}
