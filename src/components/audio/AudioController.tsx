import { useEffect } from 'react'
import { fireEnded, getAudioElement, useAudio } from '@/lib/audio'
import { useProgressStore } from '@/lib/stores'

const ARTWORK_SIZES = ['192x192', '512x512']
const ARTWORK_BASE = `${import.meta.env.BASE_URL}icons/`

export function AudioController() {
  const setProgress = useAudio((s) => s.setProgress)
  const setIsPlaying = useAudio((s) => s.setIsPlaying)
  const setIsLoading = useAudio((s) => s.setIsLoading)
  const track = useAudio((s) => s.track)
  const isPlaying = useAudio((s) => s.isPlaying)
  const togglePlay = useAudio((s) => s.togglePlay)
  const seekRelative = useAudio((s) => s.seekRelative)
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

  // Media Session metadata
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
    const safe = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { ms.setActionHandler(action, handler) } catch { /* noop */ }
    }
    safe('play', () => togglePlay())
    safe('pause', () => togglePlay())
    safe('seekbackward', (d) => seekRelative(-(d.seekOffset ?? 10)))
    safe('seekforward', (d) => seekRelative(d.seekOffset ?? 10))
    return () => {
      safe('play', null); safe('pause', null)
      safe('seekbackward', null); safe('seekforward', null)
    }
  }, [togglePlay, seekRelative])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    } catch { /* noop */ }
  }, [isPlaying])

  // Mark track listened when playing
  useEffect(() => {
    if (track && isPlaying) markListened(track.number)
  }, [track?.number, isPlaying, markListened, track])

  return null
}
