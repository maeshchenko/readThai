import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'og')
mkdirSync(OUT_DIR, { recursive: true })

const W = 1200
const H = 630
const PAPER = '#f3ece0'
const INK = '#14110c'
const INK_2 = '#2e2820'
const INK_3 = '#6b6354'
const RULE = '#d8cdb6'
const ACCENT = '#b3492e'

const SERIF = "Georgia, 'Times New Roman', 'Liberation Serif', serif"
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
const THAI = "'IBM Plex Sans Thai Looped', 'Noto Sans Thai', 'Sarabun', sans-serif"

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function splitTitle(t) {
  const m = t.match(/^([^:]+):\s*(.+)$/)
  if (m) return { eyebrow: m[1].trim(), main: m[2].trim() }
  return { eyebrow: null, main: t }
}

function wrapTitle(main, maxCharsPerLine) {
  if (main.length <= maxCharsPerLine) return [main]
  const words = main.split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const trial = cur ? cur + ' ' + w : w
    if (trial.length > maxCharsPerLine && cur) {
      lines.push(cur); cur = w
    } else {
      cur = trial
    }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 2)
}

function ogSvg({ tag, title, glyph }) {
  const t = splitTitle(title)
  const main = t.main
  const eyebrow = escape((t.eyebrow || tag || '').toUpperCase())
  // Pick font size + wrap based on length
  let fontSize, maxLine
  if (main.length > 24) { fontSize = 76; maxLine = 18 }
  else if (main.length > 16) { fontSize = 92; maxLine = 16 }
  else { fontSize = 110; maxLine = 100 }
  const lines = wrapTitle(main, maxLine)
  const lineHeight = Math.round(fontSize * 1.05)
  const baseY = lines.length === 1 ? H / 2 + 30 : H / 2 - lineHeight / 2 + fontSize * 0.85
  const titleTspans = lines.map((line, i) =>
    `<tspan x="80" y="${Math.round(baseY + i * lineHeight)}">${escape(line)}</tspan>`
  ).join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <line x1="80" y1="100" x2="${W - 80}" y2="100" stroke="${RULE}" stroke-width="1"/>
  <line x1="80" y1="${H - 100}" x2="${W - 80}" y2="${H - 100}" stroke="${RULE}" stroke-width="1"/>
  <text x="80" y="80" font-family="${MONO}" font-size="22" letter-spacing="4" fill="${INK_3}">READ THAI · 10 DAYS</text>
  <circle cx="${W - 90}" cy="72" r="9" fill="${ACCENT}"/>
  <text x="80" y="160" font-family="${MONO}" font-size="22" letter-spacing="6" fill="${ACCENT}">— ${eyebrow}</text>
  <text font-family="${SERIF}" font-weight="700" font-size="${fontSize}" fill="${INK}">${titleTspans}</text>
  <text x="${W - 130}" y="${H - 60}" font-family="${THAI}" font-size="220" fill="${INK}" text-anchor="end" opacity="0.92">${escape(glyph || 'ก')}</text>
  <text x="80" y="${H - 60}" font-family="${SERIF}" font-style="italic" font-size="26" fill="${INK_2}">читай по-тайски за 10 дней</text>
</svg>`
}

const CHAPTERS = [
  { slug: 'default',       tag: 'учебник',        title: 'Читай по-тайски за 10 дней',          glyph: 'ก' },
  { slug: 'preface',       tag: 'глава',          title: 'Предисловие',                          glyph: 'ก' },
  { slug: 'introduction',  tag: 'глава',          title: 'Введение',                              glyph: 'ข' },
  { slug: 'pronunciation', tag: 'произношение',   title: 'Гид по произношению',                  glyph: 'อ' },
  { slug: 'day-1',         tag: 'день 1',         title: 'День 1: Система классов',              glyph: 'น' },
  { slug: 'day-2',         tag: 'день 2',         title: 'День 2: Вопрос жизни и смерти',        glyph: 'ค' },
  { slug: 'day-3',         tag: 'день 3',         title: 'День 3: Короткая-прекороткая история', glyph: 'ป' },
  { slug: 'day-4',         tag: 'день 4',         title: 'День 4: Молчаливый партнёр',           glyph: 'อ' },
  { slug: 'day-5',         tag: 'день 5',         title: 'День 5: Теория тонов',                  glyph: 'ม' },
  { slug: 'intermission',  tag: 'антракт',        title: 'Антракт',                              glyph: '✦' },
  { slug: 'day-6',         tag: 'день 6',         title: 'День 6: Запомни мои слова',            glyph: 'ส' },
  { slug: 'day-7',         tag: 'день 7',         title: 'День 7: Разбираемся с кластерами',     glyph: 'ก' },
  { slug: 'day-8',         tag: 'день 8',         title: 'День 8: Услышь меня, Рор!',            glyph: 'ร' },
  { slug: 'day-9',         tag: 'день 9',         title: 'День 9: Исключения из правил',         glyph: '๙' },
  { slug: 'preliminary',   tag: 'подготовка',     title: 'Подготовка',                            glyph: '✦' },
  { slug: 'last-day',      tag: 'последний день', title: 'Последний день: Начало',                glyph: 'จ' },
  { slug: 'appendix-i',    tag: 'приложение I',   title: 'Сводка тайских символов',              glyph: 'ก' },
  { slug: 'appendix-ii',   tag: 'приложение II',  title: 'Названия согласных',                    glyph: 'ข' },
  { slug: 'appendix-iii',  tag: 'приложение III', title: 'Словарный порядок',                     glyph: 'ค' },
  { slug: 'appendix-iv',   tag: 'приложение IV',  title: 'Слова с ใ',                              glyph: 'ใ' },
  { slug: 'appendix-v',    tag: 'приложение V',   title: 'Тайские шрифты',                        glyph: 'ฬ' },
  { slug: 'glossary',      tag: 'глоссарий',      title: 'Тайско-русский глоссарий',              glyph: '§' },
]

for (const c of CHAPTERS) {
  const svg = ogSvg(c)
  const out = join(OUT_DIR, `${c.slug}.png`)
  await sharp(Buffer.from(svg)).png().toFile(out)
  console.log('og', out)
}

console.log('done', CHAPTERS.length, 'images')
