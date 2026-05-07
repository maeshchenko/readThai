import { useRef, useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Square, Play, Pause, RotateCcw, Download, ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { VolumeBars } from './VolumeBars'

type RecState = 'idle' | 'recording' | 'recorded'

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return ''
}

interface Props {
  sampleSrc: string
  trackId: string
}

export function VoiceRecorder({ sampleSrc, trackId }: Props) {
  const { t } = useTranslation()
  const [recState, setRecState] = useState<RecState>('idle')
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [isPlayingRec, setIsPlayingRec] = useState(false)
  const [isPlayingSample, setIsPlayingSample] = useState(false)
  const [abMode, setAbMode] = useState<'sample' | 'recording'>('sample')
  const [micError, setMicError] = useState<string | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const recAudioRef = useRef<HTMLAudioElement | null>(null)
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null)

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setAnalyserNode(null)
  }, [])

  useEffect(() => {
    return () => {
      cleanup()
      if (recordingUrl) URL.revokeObjectURL(recordingUrl)
    }
  }, [cleanup, recordingUrl])

  const startRecording = useCallback(async () => {
    setMicError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const ctx = new AudioContext()
      audioContextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      setAnalyserNode(analyser)

      const mime = pickMimeType()
      if (!mime) {
        setMicError('Your browser does not support audio recording.')
        cleanup()
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
        setRecordingBlob(blob)
        if (recordingUrl) URL.revokeObjectURL(recordingUrl)
        setRecordingUrl(URL.createObjectURL(blob))
        setRecState('recorded')
        cleanup()
      }

      recorder.start()
      setRecState('recording')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setMicError(t('recorder.micDenied'))
      } else {
        setMicError(t('recorder.micPermission'))
      }
      cleanup()
    }
  }, [cleanup, recordingUrl, t])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const reRecord = useCallback(() => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl)
    setRecordingBlob(null)
    setRecordingUrl(null)
    setRecState('idle')
    setIsPlayingRec(false)
  }, [recordingUrl])

  const togglePlayRecording = useCallback(() => {
    const el = recAudioRef.current
    if (!el || !recordingUrl) return
    if (isPlayingRec) {
      el.pause()
      setIsPlayingRec(false)
    } else {
      el.src = recordingUrl
      el.play()
      setIsPlayingRec(true)
    }
  }, [isPlayingRec, recordingUrl])

  const togglePlaySample = useCallback(() => {
    const el = sampleAudioRef.current
    if (!el) return
    if (isPlayingSample) {
      el.pause()
      setIsPlayingSample(false)
    } else {
      el.play()
      setIsPlayingSample(true)
    }
  }, [isPlayingSample])

  const handleDownload = useCallback(() => {
    if (!recordingBlob || !recordingUrl) return
    const a = document.createElement('a')
    a.href = recordingUrl
    const ext = recordingBlob.type.includes('webm') ? 'webm' : recordingBlob.type.includes('mp4') ? 'm4a' : 'ogg'
    a.download = `recording-${trackId}.${ext}`
    a.click()
  }, [recordingBlob, recordingUrl, trackId])

  const toggleAB = useCallback(() => {
    setAbMode((m) => (m === 'sample' ? 'recording' : 'sample'))
  }, [])

  return (
    <div className="mt-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-dim)] p-3">
      <audio
        ref={recAudioRef}
        onEnded={() => setIsPlayingRec(false)}
      />
      <audio
        ref={sampleAudioRef}
        src={sampleSrc}
        preload="metadata"
        onEnded={() => setIsPlayingSample(false)}
      />

      {micError && (
        <p className="mb-2 text-sm text-red-500">{micError}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* Record / Stop */}
        {recState === 'recording' ? (
          <button onClick={stopRecording} className="btn btn-primary">
            <Square size={14} />
            {t('recorder.stop')}
          </button>
        ) : (
          <button onClick={startRecording} className="btn btn-accent">
            <Mic size={14} />
            {recState === 'recorded' ? t('recorder.reRecord') : t('recorder.record')}
          </button>
        )}

        {/* Volume indicator while recording */}
        {recState === 'recording' && analyserNode && (
          <VolumeBars analyser={analyserNode} />
        )}

        {recState === 'recording' && (
          <span className="animate-pulse text-xs font-medium text-red-500">
            {t('recorder.recording')}
          </span>
        )}

        {/* Playback controls (after recording) */}
        {recState === 'recorded' && (
          <>
            <button
              onClick={togglePlayRecording}
              className="btn btn-ghost"
              disabled={!recordingUrl}
            >
              {isPlayingRec ? <Pause size={14} /> : <Play size={14} />}
              {t('recorder.playRecording')}
            </button>

            <button onClick={togglePlaySample} className="btn btn-ghost">
              {isPlayingSample ? <Pause size={14} /> : <Play size={14} />}
              {t('recorder.playSample')}
            </button>

            <button onClick={reRecord} className="btn btn-ghost">
              <RotateCcw size={14} />
            </button>

            <button
              onClick={toggleAB}
              className={cn(
                'btn btn-ghost text-xs',
                abMode === 'recording' && 'ring-2 ring-[var(--color-accent-500)]',
              )}
              title={t('recorder.compareAB')}
            >
              <ArrowLeftRight size={14} />
              {abMode === 'sample' ? 'A' : 'B'}
            </button>

            <button onClick={handleDownload} className="btn btn-ghost">
              <Download size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
