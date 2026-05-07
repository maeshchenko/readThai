import { useRef, useEffect, useState } from 'react'

interface Props {
  analyser: AnalyserNode
  barCount?: number
}

export function VolumeBars({ analyser, barCount = 16 }: Props) {
  const [levels, setLevels] = useState<number[]>(new Array(barCount).fill(0))
  const rafRef = useRef<number>(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bufferRef = useRef<any>(null)

  useEffect(() => {
    const freqBinCount = analyser.frequencyBinCount
    bufferRef.current = new Uint8Array(freqBinCount)

    const tick = () => {
      if (!bufferRef.current) return
      analyser.getByteFrequencyData(bufferRef.current)

      const step = Math.floor(freqBinCount / barCount)
      const newLevels: number[] = []
      for (let i = 0; i < barCount; i++) {
        let sum = 0
        for (let j = 0; j < step; j++) {
          sum += bufferRef.current[i * step + j]
        }
        newLevels.push(sum / step / 255)
      }
      setLevels(newLevels)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyser, barCount])

  return (
    <div className="flex h-6 items-end gap-px">
      {levels.map((level, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-[var(--color-accent-500)] transition-[height] duration-75"
          style={{ height: `${Math.max(2, level * 24)}px` }}
        />
      ))}
    </div>
  )
}
