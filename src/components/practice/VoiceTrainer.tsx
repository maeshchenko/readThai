import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/ui/Icon'
import { useAudio, type Track } from '@/lib/audio'

type Stage = 'idle' | 'armed' | 'recording' | 'recorded' | 'denied'

interface Props {
  sampleTrackNumber?: number
  chapterSlug?: string
  chapterTitle?: string
}

const BAR_COUNT = 28

function pad3(n: number): string { return n.toString().padStart(3, '0') }

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${ss}`
}

export function VoiceTrainer({ sampleTrackNumber, chapterSlug, chapterTitle }: Props) {
  const { i18n } = useTranslation()
  const ru = i18n.language === 'ru'

  const [stage, setStage] = useState<Stage>('idle')
  const [secs, setSecs] = useState(0)
  const [levels, setLevels] = useState<number[]>(Array(BAR_COUNT).fill(0))
  const [recordedLevels, setRecordedLevels] = useState<number[]>([])
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [playPct, setPlayPct] = useState(0)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef(0)
  const playbackElRef = useRef<HTMLAudioElement | null>(null)
  const loadAndPlay = useAudio((s) => s.loadAndPlay)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream()
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      if (playbackElRef.current) {
        playbackElRef.current.pause()
        playbackElRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopStream = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      ctxRef.current.close().catch(() => { /* noop */ })
      ctxRef.current = null
    }
    analyserRef.current = null
    recorderRef.current = null
  }

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const rec = new MediaRecorder(stream)
      recorderRef.current = rec
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        if (blobUrl) URL.revokeObjectURL(blobUrl)
        setBlobUrl(url)
        setStage('recorded')
        stopStream()
      }

      // Analyser for waveform
      const C = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
      const ctx = new C()
      ctxRef.current = ctx
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      analyserRef.current = analyser

      const data = new Uint8Array(analyser.frequencyBinCount)
      setLevels(Array(BAR_COUNT).fill(0))
      setSecs(0)
      startTimeRef.current = Date.now()

      const tick = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i]
        const avg = sum / data.length / 255
        const level = Math.min(1, Math.max(0.06, avg * 1.8))
        setLevels((arr) => [...arr.slice(1), level])
        setSecs((Date.now() - startTimeRef.current) / 1000)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()

      rec.start()
      setStage('recording')
    } catch {
      stopStream()
      setStage('denied')
    }
  }

  const stopRec = () => {
    const r = recorderRef.current
    if (r && r.state !== 'inactive') {
      // freeze the wave snapshot
      setRecordedLevels([...levels])
      r.stop()
    }
  }

  const reset = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    setBlobUrl(null)
    setRecordedLevels([])
    setSecs(0)
    setStage('armed')
  }

  const playSelf = () => {
    if (!blobUrl) return
    if (playing) {
      playbackElRef.current?.pause()
      setPlaying(false)
      return
    }
    let el = playbackElRef.current
    if (!el) {
      el = new Audio(blobUrl)
      playbackElRef.current = el
      el.addEventListener('timeupdate', () => {
        if (!el || !el.duration) return
        setPlayPct(el.currentTime / el.duration)
      })
      el.addEventListener('ended', () => {
        setPlaying(false)
        setPlayPct(0)
      })
    } else {
      el.src = blobUrl
    }
    setPlayPct(0)
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }

  const playSample = () => {
    if (sampleTrackNumber == null) return
    const track: Track = {
      id: `track-${sampleTrackNumber}`,
      number: sampleTrackNumber,
      src: `${import.meta.env.BASE_URL}audio/${pad3(sampleTrackNumber)}.mp3`,
      label: chapterTitle ? `${chapterTitle} · ${sampleTrackNumber}` : `Track ${sampleTrackNumber}`,
      chapterSlug,
      chapterTitle,
    }
    void loadAndPlay(track)
  }

  const downloadRec = () => {
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `voice-${Date.now()}.webm`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="voice-trainer">
      {stage === 'idle' && (
        <button type="button" className="vt-cta" onClick={() => setStage('armed')}>
          <span className="vt-mic"><Icon name="mic" size={14} /></span>
          <span className="vt-cta-text">
            <span className="vt-cta-label">{ru ? 'Тренировка голоса' : 'Voice practice'}</span>
            <span className="vt-cta-sub">{ru ? 'прочитайте звук вслух — сравните с образцом' : 'read the sound aloud — compare to the sample'}</span>
          </span>
          <span className="vt-cta-arrow"><Icon name="arrow" size={13} /></span>
        </button>
      )}

      {stage === 'armed' && (
        <div className="vt-panel">
          <p className="vt-hint">
            {ru
              ? 'Найдите тихое место, нажмите «начать запись», прочитайте вслух буквы, потом сравните с образцом.'
              : 'Find a quiet spot, hit “start”, read the letters aloud, then compare with the sample.'}
          </p>
          <div className="vt-actions">
            <button type="button" className="vt-btn primary" onClick={startRec}>
              <Icon name="mic" size={13} /> {ru ? 'начать запись' : 'start recording'}
            </button>
            <button type="button" className="vt-btn ghost" onClick={() => setStage('idle')}>
              {ru ? 'отмена' : 'cancel'}
            </button>
          </div>
          <div className="vt-privacy">
            <span className="lock">⌂</span>
            {ru
              ? 'Запись хранится только в памяти браузера и исчезает после перезагрузки — на сервер ничего не отправляется.'
              : 'Recording lives only in browser memory and disappears on reload — nothing is uploaded.'}
          </div>
        </div>
      )}

      {stage === 'recording' && (
        <div className="vt-panel recording">
          <div className="vt-eyebrow rec"><span className="vt-pin live" /> {ru ? 'запись' : 'recording'} · {fmt(secs)}</div>
          <div className="vt-wave">
            {levels.map((v, i) => (
              <span key={i} className="bar" style={{ height: `${Math.max(8, v * 100)}%` }} />
            ))}
          </div>
          <div className="vt-actions">
            <button type="button" className="vt-btn primary stop" onClick={stopRec}>
              <span className="stop-sq" /> {ru ? 'остановить' : 'stop'}
            </button>
            <span className="vt-meter">{ru ? 'микрофон активен' : 'mic active'}</span>
          </div>
        </div>
      )}

      {stage === 'recorded' && (
        <div className="vt-panel">
          <div className="vt-eyebrow">
            <span className="vt-pin done">✓</span> {ru ? 'ваша запись' : 'your recording'} · {fmt(secs)}
          </div>
          <div className="vt-track-solo">
            <button
              type="button"
              className={`vt-play ${playing ? 'playing' : ''}`}
              onClick={playSelf}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              <Icon name={playing ? 'pause' : 'play'} size={12} />
            </button>
            <div className="vt-wave static">
              {recordedLevels.map((v, i) => (
                <span
                  key={i}
                  className="bar"
                  style={{
                    height: `${Math.max(8, v * 100)}%`,
                    opacity: playing ? (i / Math.max(1, recordedLevels.length) < playPct ? 1 : 0.35) : 0.85,
                  }}
                />
              ))}
            </div>
          </div>
          <p className="vt-hint" style={{ margin: '6px 0 16px' }}>
            {ru ? 'Прослушайте себя и образец — сравните на слух.' : 'Listen to yourself and the sample — compare by ear.'}
          </p>
          <div className="vt-actions">
            <button type="button" className="vt-btn primary" onClick={() => { reset(); void startRec() }}>
              <Icon name="mic" size={13} /> {ru ? 'записать ещё раз' : 'record again'}
            </button>
            {sampleTrackNumber != null && (
              <button type="button" className="vt-btn" onClick={playSample}>
                <Icon name="play" size={11} /> {ru ? 'образец' : 'sample'}
              </button>
            )}
            <button type="button" className="vt-btn ghost" onClick={downloadRec}>
              <Icon name="refresh" size={12} /> {ru ? 'скачать' : 'download'}
            </button>
            <button type="button" className="vt-btn ghost" onClick={() => setStage('idle')}>
              {ru ? 'сбросить' : 'reset'}
            </button>
          </div>
        </div>
      )}

      {stage === 'denied' && (
        <div className="vt-panel">
          <div className="vt-eyebrow rec"><span className="vt-pin" /> {ru ? 'микрофон недоступен' : 'mic unavailable'}</div>
          <p className="vt-hint">
            {ru
              ? 'Доступ к микрофону запрещён. Разрешите его в настройках браузера и попробуйте снова.'
              : 'Microphone access was denied. Allow it in browser settings and try again.'}
          </p>
          <div className="vt-actions">
            <button type="button" className="vt-btn ghost" onClick={() => setStage('idle')}>
              {ru ? 'закрыть' : 'close'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
