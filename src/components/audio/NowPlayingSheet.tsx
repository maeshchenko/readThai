import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Pause,
  Play,
  RotateCcw,
  Repeat,
  Repeat1,
  Mic,
  Moon,
  ChevronsRight,
  ChevronsLeft,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useAudio } from '@/lib/audio'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/haptic'

interface Props {
  onOpenPractice?: () => void
}

const SPEED_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const
const SLEEP_STEPS = [5, 10, 30] as const

export function NowPlayingSheet({ onOpenPractice }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'en' | 'ru'
  const open = useAudio((s) => s.showNowPlaying)
  const setOpen = useAudio((s) => s.setShowNowPlaying)
  const track = useAudio((s) => s.track)
  const isPlaying = useAudio((s) => s.isPlaying)
  const isLoading = useAudio((s) => s.isLoading)
  const currentTime = useAudio((s) => s.currentTime)
  const duration = useAudio((s) => s.duration)
  const playbackRate = useAudio((s) => s.playbackRate)
  const autoNext = useAudio((s) => s.autoNext)
  const loop = useAudio((s) => s.loop)
  const sleepEndsAt = useAudio((s) => s.sleepTimerEndsAt)
  const togglePlay = useAudio((s) => s.togglePlay)
  const seek = useAudio((s) => s.seek)
  const seekRelative = useAudio((s) => s.seekRelative)
  const setRate = useAudio((s) => s.setRate)
  const setAutoNext = useAudio((s) => s.setAutoNext)
  const setLoop = useAudio((s) => s.setLoop)
  const setSleepTimer = useAudio((s) => s.setSleepTimer)

  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!sleepEndsAt) {
      setSleepRemaining(null)
      return
    }
    const tick = () => {
      const r = sleepEndsAt - Date.now()
      setSleepRemaining(r > 0 ? r : null)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [sleepEndsAt])

  if (!track) return null

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value))
  }

  const cycleRate = () => {
    const idx = SPEED_STEPS.indexOf(playbackRate as (typeof SPEED_STEPS)[number])
    const next = SPEED_STEPS[(idx + 1) % SPEED_STEPS.length]
    haptic('selection')
    setRate(next)
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => setOpen(false)}
      size="full"
      hideCloseButton
      ariaLabel={t('audio.nowPlaying')}
      className="pt-0"
    >
      <div className="-mx-5 -mt-1 flex items-center justify-between px-5 pb-2">
        <button
          onClick={() => setOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-dim)] text-[var(--color-on-surface-muted)] active:scale-95"
          aria-label="Close"
        >
          <ChevronDown size={18} />
        </button>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-on-surface-faint)]">
          {t('audio.nowPlaying')}
        </div>
        <div className="h-9 w-9" />
      </div>

      <div className="flex flex-col items-center pt-4">
        <div
          className={cn(
            'relative mb-8 flex aspect-square w-[68%] max-w-[280px] items-center justify-center rounded-[2rem] text-white',
            'shadow-[0_30px_80px_-20px_rgba(74,82,214,0.55)]',
          )}
          style={{ background: 'var(--gradient-brand)' }}
        >
          <span className="thai-looped text-[7rem] font-semibold leading-none drop-shadow-md">ก</span>
          {isPlaying && <Visualizer />}
        </div>

        <div className="mb-1 max-w-[88%] truncate text-center text-lg font-semibold tracking-tight">
          {track.label}
        </div>
        <div className="mb-7 max-w-[88%] truncate text-center text-sm text-[var(--color-on-surface-muted)]">
          {track.chapterTitle ?? 'Read Thai'}
        </div>

        <div className="w-full">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={handleSeek}
            className="seek-input w-full"
            style={{ ['--pct' as string]: `${pct}%` }}
            aria-label="Seek"
          />
          <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-[var(--color-on-surface-muted)]">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, (duration || 0) - currentTime))}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-5">
          <button
            onClick={() => { haptic('selection'); seekRelative(-10) }}
            className="flex h-12 w-12 items-center justify-center rounded-full text-[var(--color-on-surface)] active:bg-[var(--color-surface-dim)]"
            aria-label="Back 10s"
          >
            <ChevronsLeft size={26} strokeWidth={1.85} />
            <span className="-ml-0.5 text-[10px] font-semibold tabular-nums">10</span>
          </button>

          <button
            onClick={() => { haptic('light'); togglePlay() }}
            className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[0_10px_30px_-8px_rgba(74,82,214,0.55)] active:scale-95"
            style={{ background: 'var(--gradient-brand)' }}
            aria-label={isPlaying ? t('audio.pause') : t('audio.playSample')}
          >
            {isLoading ? (
              <Loader2 size={26} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={26} fill="currentColor" />
            ) : (
              <Play size={26} fill="currentColor" className="ml-1" />
            )}
          </button>

          <button
            onClick={() => { haptic('selection'); seekRelative(10) }}
            className="flex h-12 w-12 items-center justify-center rounded-full text-[var(--color-on-surface)] active:bg-[var(--color-surface-dim)]"
            aria-label="Forward 10s"
          >
            <span className="-mr-0.5 text-[10px] font-semibold tabular-nums">10</span>
            <ChevronsRight size={26} strokeWidth={1.85} />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <PillToggle active={loop} onClick={() => { haptic('selection'); setLoop(!loop) }} icon={loop ? Repeat1 : Repeat} label={t('audio.loop')} />
          <PillToggle active={autoNext} onClick={() => { haptic('selection'); setAutoNext(!autoNext) }} icon={ChevronsRight} label={t('audio.autoNext')} />
          <button
            onClick={cycleRate}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-surface-dim)] px-3 text-xs font-medium tabular-nums text-[var(--color-on-surface)] ring-1 ring-[var(--color-hairline)] active:scale-[0.96]"
          >
            {playbackRate}×
          </button>
          <button
            onClick={() => { haptic('selection'); seek(0) }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-dim)] text-[var(--color-on-surface)] ring-1 ring-[var(--color-hairline)] active:scale-[0.96]"
            aria-label="Restart"
          >
            <RotateCcw size={14} />
          </button>
          {onOpenPractice && (
            <button
              onClick={() => { haptic('selection'); onOpenPractice() }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-accent-600)] px-3 text-xs font-semibold text-white active:scale-[0.96]"
            >
              <Mic size={13} />
              {lang === 'ru' ? 'Тренировка' : 'Practice'}
            </button>
          )}
        </div>

        <div className="mt-7 w-full">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-on-surface-muted)]">
              <Moon size={13} /> {t('audio.sleepTimer')}
            </span>
            {sleepRemaining != null && (
              <button
                onClick={() => { haptic('selection'); setSleepTimer(null) }}
                className="text-xs text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]"
              >
                {formatTime(sleepRemaining / 1000)} · {lang === 'ru' ? 'отменить' : 'cancel'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SLEEP_STEPS.map((m) => {
              const active = sleepRemaining != null && sleepEndsAt && Math.abs((sleepEndsAt - Date.now()) - m * 60_000) < 60_000
              return (
                <button
                  key={m}
                  onClick={() => { haptic('selection'); setSleepTimer(m) }}
                  className={cn(
                    'rounded-xl py-2 text-sm font-medium tabular-nums transition-all active:scale-[0.97]',
                    active
                      ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                      : 'bg-[var(--color-surface-dim)] text-[var(--color-on-surface)] ring-1 ring-[var(--color-hairline)]',
                  )}
                >
                  {m} {lang === 'ru' ? 'мин' : 'min'}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        .seek-input {
          appearance: none;
          -webkit-appearance: none;
          height: 26px;
          background: transparent;
        }
        .seek-input::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(to right, var(--color-primary-500) 0%, var(--color-primary-500) var(--pct), var(--color-surface-dim) var(--pct), var(--color-surface-dim) 100%);
        }
        .seek-input::-moz-range-track {
          height: 6px;
          border-radius: 999px;
          background: var(--color-surface-dim);
        }
        .seek-input::-moz-range-progress {
          height: 6px;
          border-radius: 999px;
          background: var(--color-primary-500);
        }
        .seek-input::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          margin-top: -6px;
          border: 2px solid var(--color-primary-600);
        }
        .seek-input::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: white;
          border: 2px solid var(--color-primary-600);
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }
      `}</style>
    </BottomSheet>
  )
}

function PillToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all active:scale-[0.96]',
        active
          ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
          : 'bg-[var(--color-surface-dim)] text-[var(--color-on-surface)] ring-1 ring-[var(--color-hairline)]',
      )}
    >
      <Icon size={13} strokeWidth={1.85} />
      {label}
    </button>
  )
}

function Visualizer() {
  return (
    <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-end gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="block w-1 rounded-full bg-white/85"
          style={{
            animation: `vis ${0.7 + i * 0.12}s ease-in-out ${i * 0.08}s infinite alternate`,
            height: '8px',
          }}
        />
      ))}
      <style>{`
        @keyframes vis { from { height: 4px; } to { height: 18px; } }
      `}</style>
    </div>
  )
}

function formatTime(s: number): string {
  if (!s || !Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
