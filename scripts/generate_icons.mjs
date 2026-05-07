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
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#5e69e8"/>
      <stop offset="1" stop-color="#3d41b3"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <text x="256" y="376" font-family="Sarabun, Noto Sans Thai, sans-serif" font-weight="700" font-size="320" fill="white" text-anchor="middle">ก</text>
</svg>`

const SVG_MASKABLE = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#5e69e8"/>
      <stop offset="1" stop-color="#3d41b3"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <text x="256" y="340" font-family="Sarabun, Noto Sans Thai, sans-serif" font-weight="700" font-size="240" fill="white" text-anchor="middle">ก</text>
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
  const bg = dark ? '#0b0c10' : '#fbfbfd'
  const fg = '#5e69e8'
  const sub = dark ? '#9aa0b0' : '#5b6171'
  const iconSize = Math.round(Math.min(w, h) * 0.32)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5e69e8"/>
      <stop offset="1" stop-color="#3d41b3"/>
    </linearGradient>
  </defs>
  <g transform="translate(${w / 2 - iconSize / 2}, ${h / 2 - iconSize / 2 - iconSize * 0.1})">
    <rect width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.22}" fill="url(#g)"/>
    <text x="${iconSize / 2}" y="${iconSize * 0.74}" font-family="Sarabun, Noto Sans Thai, sans-serif" font-weight="700" font-size="${iconSize * 0.65}" fill="white" text-anchor="middle">ก</text>
  </g>
  <text x="${w / 2}" y="${h / 2 + iconSize * 0.85}" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(Math.min(w, h) * 0.034)}" font-weight="600" fill="${fg}" text-anchor="middle">Read Thai</text>
  <text x="${w / 2}" y="${h / 2 + iconSize * 0.85 + Math.round(Math.min(w, h) * 0.045)}" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(Math.min(w, h) * 0.022)}" fill="${sub}" text-anchor="middle">in 10 Days</text>
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
