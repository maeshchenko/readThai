import { useRef, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, Volume2, Mic } from 'lucide-react'
import { useAudioStore, useProgressStore } from '@/lib/stores'
import { cn } from '@/lib/cn'
import { VoiceRecorder } from '@/components/recorder/VoiceRecorder'

interface Props {
  trackNumber: number
  label?: string
}

function padTrack(n: number): string {
  return n.toString().padStart(3, '0')
}

export function TrackCard({ trackNumber, label }: Props) {
  const { t } = useTranslation()
  const audioRef = useRef<HTMLAudioElement>(null)
  const { currentTrackId, play, stop } = useAudioStore()
  const { markListened } = useProgressStore()

  const trackId = `track-${trackNumber}`
  const isPlaying = currentTrackId === trackId
  const src = `${import.meta.env.BASE_URL}audio/${padTrack(trackNumber)}.mp3`

  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showRecorder, setShowRecorder] = useState(false)

  const togglePlay = useCallback(() => {
    const el = audioRef.current
    if (!el) return

    if (isPlaying) {
      el.pause()
      stop()
    } else {
      play(trackId)
      el.play().catch(() => stop())
      markListened(trackNumber)
    }
  }, [isPlaying, trackId, trackNumber, play, stop, markListened])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (!isPlaying && !el.paused) {
      el.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const el = audioRef.current
    if (el) el.playbackRate = playbackRate
  }, [playbackRate])

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration)
  }

  const handleEnded = () => {
    setCurrentTime(0)
    stop()
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    if (!el || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    el.currentTime = pct * duration
    setCurrentTime(el.currentTime)
  }

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5]
    const idx = speeds.indexOf(playbackRate)
    setPlaybackRate(speeds[(idx + 1) % speeds.length])
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="track-card">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all',
            isPlaying
              ? 'bg-[var(--color-primary-600)] text-white shadow-[0_4px_14px_rgba(74,82,214,0.4)]'
              : 'bg-[var(--color-primary-600)] text-white shadow-[0_2px_8px_rgba(74,82,214,0.25)] hover:bg-[var(--color-primary-700)] hover:shadow-[0_4px_14px_rgba(74,82,214,0.35)]',
          )}
          aria-label={isPlaying ? t('audio.pause') : t('audio.playSample')}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-[var(--color-on-surface)]">
              <Volume2 size={12} className="text-[var(--color-on-surface-faint)]" />
              {label ?? t('audio.track', { n: trackNumber })}
            </span>
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-[var(--color-on-surface-muted)]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button
                onClick={cycleSpeed}
                className="rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--color-on-surface-muted)] ring-1 ring-[var(--color-hairline)] transition-colors hover:bg-[var(--color-surface-dim)]"
              >
                {playbackRate}x
              </button>
            </div>
          </div>

          <div
            className="group relative h-1.5 cursor-pointer rounded-full bg-[var(--color-surface-dim)] ring-1 ring-[var(--color-hairline)]"
            onClick={handleSeek}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
          >
            <div
              className="h-full rounded-full bg-[var(--color-primary-500)] transition-[width] duration-100"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[var(--color-primary-600)] opacity-0 shadow-[var(--shadow-elev)] transition-opacity group-hover:opacity-100"
              style={{ left: `${pct}%`, marginLeft: '-6px' }}
            />
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--color-hairline)' }}>
        <button
          onClick={() => setShowRecorder((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-[var(--color-on-surface-muted)] transition-colors hover:bg-[var(--color-surface-dim)] hover:text-[var(--color-on-surface)]"
        >
          <Mic size={12} />
          {t('recorder.recordYourVoice')}
        </button>
        {showRecorder && (
          <VoiceRecorder sampleSrc={src} trackId={trackId} />
        )}
      </div>
    </div>
  )
}

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
