import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Play, Pause, Mic, Loader2 } from 'lucide-react'
import { useAudio } from '@/lib/audio'
import { useProgressStore } from '@/lib/stores'
import { getChapterBySlug } from '@/lib/chapters'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/haptic'
import { VoiceRecorder } from '@/components/recorder/VoiceRecorder'

interface Props {
  trackNumber: number
  label?: string
}

function padTrack(n: number): string {
  return n.toString().padStart(3, '0')
}

export function TrackCard({ trackNumber, label }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'en' | 'ru'
  const location = useLocation()

  const trackId = `track-${trackNumber}`
  const src = `${import.meta.env.BASE_URL}audio/${padTrack(trackNumber)}.mp3`
  const computedLabel = label ?? t('audio.track', { n: trackNumber })

  const slug = location.pathname.replace(/^\//, '')
  const chapterMeta = getChapterBySlug(slug)
  const chapterTitle = chapterMeta ? (lang === 'ru' ? chapterMeta.titleRu : chapterMeta.titleEn) : undefined

  const activeTrackId = useAudio((s) => s.track?.id)
  const isPlaying = useAudio((s) => s.isPlaying) && activeTrackId === trackId
  const isLoading = useAudio((s) => s.isLoading) && activeTrackId === trackId
  const currentTime = useAudio((s) => s.currentTime)
  const duration = useAudio((s) => s.duration)
  const playbackRate = useAudio((s) => s.playbackRate)
  const setRate = useAudio((s) => s.setRate)
  const loadAndPlay = useAudio((s) => s.loadAndPlay)
  const togglePlay = useAudio((s) => s.togglePlay)
  const seek = useAudio((s) => s.seek)
  const markListened = useProgressStore((s) => s.markListened)

  const isActive = activeTrackId === trackId
  const trackTime = isActive ? currentTime : 0
  const trackDuration = isActive ? duration : 0
  const pct = trackDuration > 0 ? (trackTime / trackDuration) * 100 : 0

  const [showRecorderInline, setShowRecorderInline] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const onPlayClick = useCallback(() => {
    haptic('light')
    if (isActive) {
      togglePlay()
    } else {
      loadAndPlay({
        id: trackId,
        number: trackNumber,
        src,
        label: computedLabel,
        chapterSlug: chapterMeta?.slug,
        chapterTitle,
      })
      markListened(trackNumber)
    }
  }, [isActive, togglePlay, loadAndPlay, trackId, trackNumber, src, computedLabel, chapterMeta?.slug, chapterTitle, markListened])

  const onSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackDuration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pctClick = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(pctClick * trackDuration)
  }

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5]
    const idx = speeds.indexOf(playbackRate)
    haptic('selection')
    setRate(speeds[(idx + 1) % speeds.length] ?? 1)
  }

  return (
    <div ref={trackRef} className="track-card">
      <div className="flex items-center gap-3">
        <button
          onClick={onPlayClick}
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full transition-all active:scale-95',
            'h-12 w-12 md:h-10 md:w-10',
            'text-white',
            isActive
              ? 'shadow-[0_4px_14px_rgba(74,82,214,0.4)]'
              : 'shadow-[0_2px_8px_rgba(74,82,214,0.25)]',
          )}
          style={{ background: 'var(--gradient-brand)' }}
          aria-label={isPlaying ? t('audio.pause') : t('audio.playSample')}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="truncate font-medium text-[var(--color-on-surface)]">
              {computedLabel}
            </span>
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-[var(--color-on-surface-muted)]">
                {formatTime(trackTime)} / {formatTime(trackDuration)}
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
            className="group relative h-3 cursor-pointer touch-none"
            onPointerDown={onSeek}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
          >
            <div className="absolute inset-y-[5px] left-0 right-0 rounded-full bg-[var(--color-surface-dim)] ring-1 ring-[var(--color-hairline)]" />
            <div
              className="absolute inset-y-[5px] left-0 rounded-full bg-[var(--color-primary-500)] transition-[width] duration-100"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[var(--color-primary-600)] opacity-0 shadow-[var(--shadow-elev)] transition-opacity group-hover:opacity-100 group-active:opacity-100"
              style={{ left: `${pct}%`, marginLeft: '-6px' }}
            />
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--color-hairline)' }}>
        <button
          onClick={() => {
            haptic('selection')
            setShowRecorderInline((v) => !v)
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-[var(--color-on-surface-muted)] transition-colors hover:bg-[var(--color-surface-dim)] hover:text-[var(--color-on-surface)]"
        >
          <Mic size={12} />
          {t('recorder.recordYourVoice')}
        </button>

        {showRecorderInline && (
          <VoiceRecorder sampleSrc={src} trackId={trackId} />
        )}
      </div>
    </div>
  )
}

function formatTime(s: number): string {
  if (!s || !Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
