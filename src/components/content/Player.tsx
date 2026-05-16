import { useTranslation } from 'react-i18next'
import { useAudio, type Track } from '@/lib/audio'
import { Icon } from '@/components/ui/Icon'

interface Props {
  trackNumber: number
  label?: string
  chapterSlug?: string
  chapterTitle?: string
}

const RATE_CYCLE = [1, 0.75, 1.25, 1.5]

function pad3(n: number): string {
  return n.toString().padStart(3, '0')
}

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  return `${m}:${ss.toString().padStart(2, '0')}`
}

export function Player({ trackNumber, label, chapterSlug, chapterTitle }: Props) {
  const { i18n } = useTranslation()
  const ru = i18n.language === 'ru'
  const cur = useAudio((s) => s.track)
  const isPlaying = useAudio((s) => s.isPlaying)
  const currentTime = useAudio((s) => s.currentTime)
  const duration = useAudio((s) => s.duration)
  const playbackRate = useAudio((s) => s.playbackRate)
  const loadAndPlay = useAudio((s) => s.loadAndPlay)
  const togglePlay = useAudio((s) => s.togglePlay)
  const seek = useAudio((s) => s.seek)
  const setRate = useAudio((s) => s.setRate)

  const id = `track-${trackNumber}`
  const isMine = cur?.id === id
  const mySrc = `${import.meta.env.BASE_URL}audio/${pad3(trackNumber)}.mp3`
  const myLabel = label || (ru ? `Трек ${trackNumber}` : `Track ${trackNumber}`)
  const dur = isMine ? duration : 0
  const t = isMine ? currentTime : 0
  const pct = dur > 0 ? (t / dur) * 100 : 0
  const playing = isMine && isPlaying

  const play = () => {
    if (isMine) {
      togglePlay()
    } else {
      const track: Track = {
        id,
        number: trackNumber,
        src: mySrc,
        label: myLabel,
        chapterSlug,
        chapterTitle,
      }
      void loadAndPlay(track)
    }
  }

  const cycleRate = () => {
    const i = RATE_CYCLE.indexOf(playbackRate)
    const next = RATE_CYCLE[(i + 1) % RATE_CYCLE.length]
    setRate(next)
  }

  const onScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMine || dur <= 0) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    seek(x * dur)
  }

  return (
    <div className="player">
      <button type="button" className="play" onClick={play} aria-label={playing ? 'Pause' : 'Play'}>
        <Icon name={playing ? 'pause' : 'play'} size={14} />
      </button>
      <div className="info">
        <div className="label">
          <span>{ru ? 'трек' : 'track'}</span>
          <b>{myLabel}</b>
        </div>
        <div className="scrub" onClick={onScrub}>
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="time">{fmt(t)} / {fmt(dur)}</span>
        <button type="button" className="speed" onClick={cycleRate}>
          {playbackRate}×
        </button>
      </div>
    </div>
  )
}
