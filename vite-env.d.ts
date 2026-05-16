/// <reference types="vite/client" />

declare module 'lamejs' {
  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number)
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array
    flush(): Int8Array
  }
}

interface Window {
  ym?: (counterId: number, method: string, ...args: unknown[]) => void
}
