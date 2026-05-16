import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(__dirname, '..', 'public')
const ICONS_DIR = join(PUBLIC_DIR, 'icons')
const SPLASH_DIR = join(PUBLIC_DIR, 'splash')
mkdirSync(ICONS_DIR, { recursive: true })
mkdirSync(SPLASH_DIR, { recursive: true })

const SVG_ANY = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#14110c"/>
  <text x="256" y="376" font-family="'IBM Plex Sans Thai Looped', 'Noto Sans Thai', Sarabun, sans-serif" font-weight="500" font-size="352" fill="#f3ece0" text-anchor="middle">ก</text>
  <circle cx="416" cy="104" r="24" fill="#b3492e"/>
</svg>`

const SVG_MASKABLE = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#14110c"/>
  <text x="256" y="340" font-family="'IBM Plex Sans Thai Looped', 'Noto Sans Thai', Sarabun, sans-serif" font-weight="500" font-size="264" fill="#f3ece0" text-anchor="middle">ก</text>
</svg>`

const ICONS = [
  { name: 'icon-192.png', size: 192, svg: SVG_ANY },
  { name: 'icon-512.png', size: 512, svg: SVG_ANY },
  { name: 'maskable-192.png', size: 192, svg: SVG_MASKABLE },
  { name: 'maskable-512.png', size: 512, svg: SVG_MASKABLE },
  { name: 'apple-touch-icon-180.png', size: 180, svg: SVG_ANY },
  { name: 'apple-touch-icon-152.png', size: 152, svg: SVG_ANY },
  { name: 'apple-touch-icon-120.png', size: 120, svg: SVG_ANY },
]

for (const t of ICONS) {
  const out = join(ICONS_DIR, t.name)
  await sharp(Buffer.from(t.svg)).resize(t.size, t.size).png().toFile(out)
  console.log('icon', out)
}

writeFileSync(join(ICONS_DIR, 'source-any.svg'), SVG_ANY)
writeFileSync(join(ICONS_DIR, 'source-maskable.svg'), SVG_MASKABLE)

// Splash images for both light and dark themes for major iOS sizes
const SPLASH_TARGETS = [
  { name: 'iphone-se', w: 750, h: 1334 },
  { name: 'iphone-x', w: 1125, h: 2436 },
  { name: 'iphone-13', w: 1170, h: 2532 },
  { name: 'iphone-15-pro-max', w: 1290, h: 2796 },
]

const splashSvg = (w, h, dark) => {
  const bg = dark ? '#1a1612' : '#f3ece0'
  const ink = dark ? '#f0e8d8' : '#14110c'
  const sub = dark ? '#9a907c' : '#6b6354'
  const accent = dark ? '#e07650' : '#b3492e'
  const iconSize = Math.round(Math.min(w, h) * 0.32)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <g transform="translate(${w / 2 - iconSize / 2}, ${h / 2 - iconSize / 2 - iconSize * 0.1})">
    <rect width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.16}" fill="${ink}"/>
    <text x="${iconSize / 2}" y="${iconSize * 0.74}" font-family="'IBM Plex Sans Thai Looped', 'Noto Sans Thai', Sarabun, sans-serif" font-weight="500" font-size="${iconSize * 0.7}" fill="${bg}" text-anchor="middle">ก</text>
    <circle cx="${iconSize * 0.82}" cy="${iconSize * 0.2}" r="${iconSize * 0.05}" fill="${accent}"/>
  </g>
  <text x="${w / 2}" y="${h / 2 + iconSize * 0.85}" font-family="'Cormorant Garamond', 'Source Serif 4', serif" font-size="${Math.round(Math.min(w, h) * 0.04)}" font-weight="500" fill="${ink}" text-anchor="middle">Read Thai</text>
  <text x="${w / 2}" y="${h / 2 + iconSize * 0.85 + Math.round(Math.min(w, h) * 0.05)}" font-family="'Cormorant Garamond', 'Source Serif 4', serif" font-style="italic" font-size="${Math.round(Math.min(w, h) * 0.024)}" fill="${sub}" text-anchor="middle">in 10 Days</text>
</svg>`
}

for (const t of SPLASH_TARGETS) {
  for (const mode of ['light', 'dark']) {
    const svg = splashSvg(t.w, t.h, mode === 'dark')
    const out = join(SPLASH_DIR, `${t.name}-${mode}.png`)
    await sharp(Buffer.from(svg)).png().toFile(out)
    console.log('splash', out)
  }
}

console.log('done')
