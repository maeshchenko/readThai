import { Pause, Play, X, Loader2 } from 'lucide-react'
import { useAudio } from '@/lib/audio'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/haptic'

export function MiniPlayer() {
  const isMobile = useIsMobile()
  const track = useAudio((s) => s.track)
  const isPlaying = useAudio((s) => s.isPlaying)
  const isLoading = useAudio((s) => s.isLoading)
  const currentTime = useAudio((s) => s.currentTime)
  const duration = useAudio((s) => s.duration)
  const miniHidden = useAudio((s) => s.miniHidden)
  const togglePlay = useAudio((s) => s.togglePlay)
  const stop = useAudio((s) => s.stop)
  const setShowNowPlaying = useAudio((s) => s.setShowNowPlaying)

  if (!track || miniHidden || !isMobile) return null

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-3 md:hidden"
      style={{ bottom: 'calc(var(--tabbar-total) + 8px)' }}
    >
      <div
        className={cn(
          'pointer-events-auto flex w-full max-w-[460px] items-center gap-3 rounded-2xl bg-[var(--color-surface-elevated)]/95 px-3 py-2 shadow-[var(--shadow-pop)] ring-1 ring-[var(--color-hairline)] backdrop-blur-xl',
        )}
      >
        <button
          onClick={() => {
            haptic('selection')
            setShowNowPlaying(true)
          }}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label="Open now playing"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: 'var(--gradient-brand)' }}
          >
            <span className="thai-looped text-lg font-semibold">ก</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold tracking-tight">{track.label}</div>
            <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[var(--color-surface-dim)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary-500)] transition-[width] duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            haptic('light')
            togglePlay()
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-600)] text-white shadow-[0_2px_8px_rgba(74,82,214,0.35)] active:scale-95"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <button
          onClick={() => {
            haptic('selection')
            stop()
          }}
          className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-on-surface-muted)] active:bg-[var(--color-surface-dim)]"
          aria-label="Close player"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
