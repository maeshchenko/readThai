import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fireEnded, getAudioElement, onTrackEnded, useAudio } from '@/lib/audio'
import { chapters } from '@/lib/chapters'
import { useProgressStore } from '@/lib/stores'

const ARTWORK_SIZES = ['96x96', '192x192', '256x256', '384x384', '512x512']
const ARTWORK_BASE = `${import.meta.env.BASE_URL}icons/`

export function AudioController() {
  const navigate = useNavigate()
  const setProgress = useAudio((s) => s.setProgress)
  const setIsPlaying = useAudio((s) => s.setIsPlaying)
  const setIsLoading = useAudio((s) => s.setIsLoading)
  const track = useAudio((s) => s.track)
  const isPlaying = useAudio((s) => s.isPlaying)
  const autoNext = useAudio((s) => s.autoNext)
  const loop = useAudio((s) => s.loop)
  const sleepTimerEndsAt = useAudio((s) => s.sleepTimerEndsAt)
  const setSleepTimer = useAudio((s) => s.setSleepTimer)
  const pause = useAudio((s) => s.pause)
  const seekRelative = useAudio((s) => s.seekRelative)
  const togglePlay = useAudio((s) => s.togglePlay)
  const loadAndPlay = useAudio((s) => s.loadAndPlay)
  const markListened = useProgressStore((s) => s.markListened)

  useEffect(() => {
    const el = getAudioElement()

    const onTime = () => setProgress(el.currentTime, el.duration || 0)
    const onMeta = () => setProgress(el.currentTime, el.duration || 0)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onWait = () => setIsLoading(true)
    const onCanPlay = () => setIsLoading(false)
    const onEnded = () => {
      setIsPlaying(false)
      setProgress(0, el.duration || 0)
      try { el.currentTime = 0 } catch { /* noop */ }
      fireEnded()
    }

    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('waiting', onWait)
    el.addEventListener('canplay', onCanPlay)
    el.addEventListener('ended', onEnded)

    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('waiting', onWait)
      el.removeEventListener('canplay', onCanPlay)
      el.removeEventListener('ended', onEnded)
    }
  }, [setProgress, setIsPlaying, setIsLoading])

  // Media Session
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !track) return
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.label,
        artist: track.chapterTitle ?? 'Read Thai',
        album: 'Read Thai in 10 Days',
        artwork: ARTWORK_SIZES.map((s) => ({
          src: `${ARTWORK_BASE}icon-${s.split('x')[0]}.png`,
          sizes: s,
          type: 'image/png',
        })),
      })
    } catch { /* noop */ }
  }, [track])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    const safe = (action: MediaSessionAction, handler: MediaSessionActionHandler) => {
      try { ms.setActionHandler(action, handler) } catch { /* noop */ }
    }
    safe('play', () => togglePlay())
    safe('pause', () => togglePlay())
    safe('seekbackward', (d) => seekRelative(-(d.seekOffset ?? 10)))
    safe('seekforward', (d) => seekRelative(d.seekOffset ?? 10))
    safe('previoustrack', () => seekRelative(-10))
    safe('nexttrack', () => seekRelative(10))
    return () => {
      safe('play', null as unknown as MediaSessionActionHandler)
      safe('pause', null as unknown as MediaSessionActionHandler)
      safe('seekbackward', null as unknown as MediaSessionActionHandler)
      safe('seekforward', null as unknown as MediaSessionActionHandler)
      safe('previoustrack', null as unknown as MediaSessionActionHandler)
      safe('nexttrack', null as unknown as MediaSessionActionHandler)
    }
  }, [togglePlay, seekRelative])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    } catch { /* noop */ }
  }, [isPlaying])

  // Auto-next handler
  useEffect(() => {
    const off = onTrackEnded(() => {
      const cur = useAudio.getState().track
      if (!cur || !autoNext || loop) return
      const ch = chapters.find((c) => c.slug === cur.chapterSlug)
      if (!ch) return
      const idx = ch.tracks.indexOf(cur.number)
      const nextNum = idx >= 0 && idx < ch.tracks.length - 1 ? ch.tracks[idx + 1] : null
      if (nextNum != null) {
        const padded = nextNum.toString().padStart(3, '0')
        loadAndPlay({
          id: `track-${nextNum}`,
          number: nextNum,
          src: `${import.meta.env.BASE_URL}audio/${padded}.mp3`,
          label: `${ch.titleEn} · ${nextNum}`,
          chapterSlug: ch.slug,
          chapterTitle: ch.titleEn,
        })
        markListened(nextNum)
      }
    })
    return off
  }, [autoNext, loop, loadAndPlay, markListened])

  // Sleep timer
  useEffect(() => {
    if (!sleepTimerEndsAt) return
    const remaining = sleepTimerEndsAt - Date.now()
    if (remaining <= 0) {
      pause()
      setSleepTimer(null)
      return
    }
    const id = window.setTimeout(() => {
      pause()
      setSleepTimer(null)
    }, remaining)
    return () => window.clearTimeout(id)
  }, [sleepTimerEndsAt, pause, setSleepTimer])

  // Track listened on play start
  useEffect(() => {
    if (track && isPlaying) markListened(track.number)
  }, [track?.number, isPlaying, markListened, track])

  // Suppress unused navigate warning (reserved for future deep-link)
  void navigate

  return null
}
