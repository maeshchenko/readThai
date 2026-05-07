import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Download,
  Check,
  X,
  Headphones,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useToast } from '@/components/ui/Toast'
import { useAudio } from '@/lib/audio'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/haptic'

interface Props {
  open: boolean
  onClose: () => void
  sampleSrc: string
  trackId: string
  trackLabel?: string
}

type Phase = 'ready' | 'countdown' | 'recording' | 'review' | 'denied'

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) return mime
  }
  return ''
}

export function PracticeSheet({ open, onClose, sampleSrc, trackId, trackLabel }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'en' | 'ru'
  const toast = useToast()

  const [phase, setPhase] = useState<Phase>('ready')
  const [countdown, setCountdown] = useState<number>(3)
  const [elapsed, setElapsed] = useState(0)
  const [level, setLevel] = useState(0)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [playingWho, setPlayingWho] = useState<'sample' | 'me' | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [requesting, setRequesting] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  const startedAtRef = useRef<number>(0)
  const samplePlayerRef = useRef<HTMLAudioElement | null>(null)
  const myPlayerRef = useRef<HTMLAudioElement | null>(null)

  const pauseGlobal = useAudio((s) => s.pause)
  const isGlobalPlaying = useAudio((s) => s.isPlaying)

  // Pause global track when entering practice
  useEffect(() => {
    if (open && isGlobalPlaying) pauseGlobal()
  }, [open, isGlobalPlaying, pauseGlobal])

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    analyserRef.current = null
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const resetAll = useCallback(() => {
    cleanupStream()
    if (recordingUrl) URL.revokeObjectURL(recordingUrl)
    setRecordingUrl(null)
    setPhase('ready')
    setCountdown(3)
    setElapsed(0)
    setLevel(0)
    setPlayingWho(null)
    setPermissionError(null)
  }, [cleanupStream, recordingUrl])

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(resetAll, 200)
      return () => clearTimeout(t)
    }
  }, [open, resetAll])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStream()
      if (recordingUrl) URL.revokeObjectURL(recordingUrl)
    }
  }, [cleanupStream, recordingUrl])

  const beginCountdown = useCallback(async () => {
    setPermissionError(null)
    setRequesting(true)
    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      setRequesting(false)
      const msg = err instanceof DOMException && err.name === 'NotAllowedError'
        ? t('recorder.micDenied')
        : t('recorder.micPermission')
      setPermissionError(msg)
      toast.error(msg)
      setPhase('denied')
      return
    }
    setRequesting(false)
    streamRef.current = stream

    const ctx = new AudioContext()
    audioCtxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    source.connect(analyser)
    analyserRef.current = analyser

    setPhase('countdown')
    setCountdown(3)
    haptic('medium')

    let count = 3
    const tick = () => {
      count -= 1
      if (count > 0) {
        setCountdown(count)
        haptic('light')
        setTimeout(tick, 800)
      } else {
        setCountdown(0)
        startActualRecording()
      }
    }
    setTimeout(tick, 800)
  }, [t])

  const startActualRecording = useCallback(() => {
    const stream = streamRef.current
    if (!stream) return
    const mime = pickMimeType()
    if (!mime) {
      setPermissionError('Browser does not support recording')
      setPhase('denied')
      return
    }
    const recorder = new MediaRecorder(stream, { mimeType: mime })
    mediaRecorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime })
      const url = URL.createObjectURL(blob)
      if (recordingUrl) URL.revokeObjectURL(recordingUrl)
      setRecordingUrl(url)
      setPhase('review')
      haptic('success')
      cleanupStream()
    }
    recorder.start()
    startedAtRef.current = Date.now()
    setPhase('recording')
    setElapsed(0)

    // Start animation loop
    const buf = new Uint8Array(analyserRef.current?.frequencyBinCount ?? 32)
    const loop = () => {
      const a = analyserRef.current
      if (!a) return
      a.getByteFrequencyData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) sum += buf[i]
      const avg = sum / buf.length / 255
      setLevel(avg)
      setElapsed((Date.now() - startedAtRef.current) / 1000)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [recordingUrl, cleanupStream])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const togglePlay = useCallback((who: 'sample' | 'me') => {
    const otherEl = who === 'sample' ? myPlayerRef.current : samplePlayerRef.current
    const el = who === 'sample' ? samplePlayerRef.current : myPlayerRef.current
    if (!el) return

    if (otherEl && !otherEl.paused) {
      otherEl.pause()
      otherEl.currentTime = 0
    }

    if (playingWho === who) {
      el.pause()
      el.currentTime = 0
      setPlayingWho(null)
    } else {
      el.currentTime = 0
      el.play().then(() => setPlayingWho(who)).catch(() => setPlayingWho(null))
    }
  }, [playingWho])

  const handleSave = useCallback(() => {
    if (!recordingUrl) return
    const a = document.createElement('a')
    a.href = recordingUrl
    a.download = `recording-${trackId}.webm`
    a.click()
    haptic('success')
    toast.success(lang === 'ru' ? 'Запись сохранена' : 'Recording saved')
  }, [recordingUrl, trackId, toast, lang])

  // Helpers for level visual
  const levelPct = Math.max(0, Math.min(1, level * 1.4))
  const tooQuiet = phase === 'recording' && elapsed > 1.5 && levelPct < 0.07
  const tooLoud = phase === 'recording' && levelPct > 0.92

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      size="full"
      title={trackLabel ?? t('recorder.recordYourVoice')}
      hideCloseButton={false}
      ariaLabel={t('recorder.recordYourVoice')}
    >
      <audio
        ref={samplePlayerRef}
        src={sampleSrc}
        preload="metadata"
        onEnded={() => setPlayingWho(null)}
      />
      {recordingUrl && (
        <audio
          ref={myPlayerRef}
          src={recordingUrl}
          preload="metadata"
          onEnded={() => setPlayingWho(null)}
        />
      )}

      <div className="flex flex-col items-center pt-4 pb-2">
        {/* Big mic with ring */}
        <div className="relative mb-6 flex h-[200px] w-[200px] items-center justify-center">
          <div
            className={cn(
              'absolute inset-0 rounded-full transition-transform duration-150',
              phase === 'recording' ? 'bg-red-500/10' : 'bg-[var(--color-primary-500)]/10',
            )}
            style={{ transform: `scale(${0.85 + levelPct * 0.4})` }}
            aria-hidden
          />
          <div
            className={cn(
              'absolute inset-3 rounded-full transition-transform duration-150',
              phase === 'recording' ? 'bg-red-500/15' : 'bg-[var(--color-primary-500)]/15',
              tooLoud && 'ring-2 ring-red-500',
            )}
            style={{ transform: `scale(${0.8 + levelPct * 0.5})` }}
            aria-hidden
          />
          <div
            className={cn(
              'flex h-[120px] w-[120px] items-center justify-center rounded-full text-white transition-colors',
              phase === 'recording'
                ? 'bg-red-500 shadow-[0_18px_50px_-15px_rgba(239,68,68,0.55)]'
                : phase === 'review'
                ? 'bg-[var(--color-accent-600)] shadow-[0_18px_50px_-15px_rgba(16,185,129,0.55)]'
                : 'shadow-[0_18px_50px_-15px_rgba(74,82,214,0.55)]',
            )}
            style={{
              background:
                phase === 'recording'
                  ? undefined
                  : phase === 'review'
                  ? undefined
                  : 'var(--gradient-brand)',
            }}
          >
            {phase === 'countdown' ? (
              <span className="text-5xl font-bold tabular-nums">{countdown}</span>
            ) : phase === 'review' ? (
              <Check size={40} strokeWidth={2.5} />
            ) : (
              <Mic size={42} strokeWidth={1.85} />
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="mb-1 h-5 text-sm font-medium text-[var(--color-on-surface)]">
          {phase === 'ready' && t('recorder.tapToRecord')}
          {phase === 'countdown' && t('recorder.ready')}
          {phase === 'recording' && (
            <span className="inline-flex items-center gap-2 text-red-500">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              {t('recorder.recording')} {' · '}
              <span className="tabular-nums">{formatTime(elapsed)}</span>
            </span>
          )}
          {phase === 'review' && (lang === 'ru' ? 'Сравни с образцом' : 'Compare with sample')}
          {phase === 'denied' && (
            <span className="inline-flex items-center gap-1.5 text-amber-600">
              <AlertTriangle size={14} />
              {permissionError ?? t('recorder.micPermission')}
            </span>
          )}
        </div>

        <div className="mb-6 h-4 text-xs text-[var(--color-on-surface-muted)]">
          {tooQuiet && <span>{t('recorder.tooQuiet')}</span>}
          {tooLoud && <span className="text-red-500">{t('recorder.tooLoud')}</span>}
        </div>

        {/* Primary action */}
        {phase === 'ready' && (
          <button
            disabled={requesting}
            onClick={() => { haptic('selection'); beginCountdown() }}
            className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(74,82,214,0.55)] transition-transform active:scale-[0.97] disabled:opacity-60"
            style={{ background: 'var(--gradient-brand)' }}
          >
            {requesting ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
            {t('recorder.record')}
          </button>
        )}

        {phase === 'recording' && (
          <button
            onClick={() => { haptic('medium'); stopRecording() }}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-red-500 px-7 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(239,68,68,0.55)] transition-transform active:scale-[0.97]"
          >
            <Square size={16} fill="currentColor" />
            {t('recorder.stop')}
          </button>
        )}

        {phase === 'denied' && (
          <button
            onClick={() => { setPhase('ready'); setPermissionError(null) }}
            className="btn btn-primary"
          >
            {lang === 'ru' ? 'Попробовать снова' : 'Try again'}
          </button>
        )}

        {/* Review controls */}
        {phase === 'review' && (
          <div className="w-full space-y-3">
            <ReviewRow
              label={lang === 'ru' ? 'Образец' : 'Sample'}
              accent="primary"
              icon={Headphones}
              playing={playingWho === 'sample'}
              onToggle={() => { haptic('selection'); togglePlay('sample') }}
            />
            <ReviewRow
              label={lang === 'ru' ? 'Ваша запись' : 'Your take'}
              accent="accent"
              icon={Mic}
              playing={playingWho === 'me'}
              onToggle={() => { haptic('selection'); togglePlay('me') }}
            />

            <div className="flex items-center gap-2 pt-3">
              <button
                onClick={() => { haptic('selection'); resetAll() }}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--color-surface-dim)] px-4 py-3 text-sm font-medium text-[var(--color-on-surface)] ring-1 ring-[var(--color-hairline)] active:scale-[0.98]"
              >
                <RotateCcw size={16} />
                {t('recorder.reRecord')}
              </button>
              <button
                onClick={handleSave}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
                style={{ background: 'var(--gradient-brand)' }}
              >
                <Download size={16} />
                {t('recorder.save')}
              </button>
            </div>

            <button
              onClick={() => { haptic('selection'); resetAll(); onClose() }}
              className="mx-auto flex items-center gap-1 px-2 pt-1 text-xs text-[var(--color-on-surface-muted)] active:text-[var(--color-on-surface)]"
            >
              <X size={12} />
              {t('recorder.discard')}
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}

function ReviewRow({
  label,
  accent,
  icon: Icon,
  playing,
  onToggle,
}: {
  label: string
  accent: 'primary' | 'accent'
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  playing: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl bg-[var(--color-surface-dim)] px-4 py-3 ring-1 ring-[var(--color-hairline)]',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white',
          accent === 'primary' ? 'bg-[var(--color-primary-600)]' : 'bg-[var(--color-accent-600)]',
        )}
      >
        <Icon size={16} strokeWidth={1.85} />
      </div>
      <div className="min-w-0 flex-1 truncate text-sm font-medium">{label}</div>
      <button
        onClick={onToggle}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-transform active:scale-95',
          accent === 'primary' ? 'bg-[var(--color-primary-600)]' : 'bg-[var(--color-accent-600)]',
        )}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </button>
    </div>
  )
}

function formatTime(s: number): string {
  if (!s || !Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
