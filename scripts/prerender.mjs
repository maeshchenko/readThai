import { createServer } from 'node:http'
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const BASE = '/readThai/'
const PORT = 4173

const ROUTES = [
  '/',
  '/preface',
  '/introduction',
  '/pronunciation',
  '/day-1', '/day-2', '/day-3', '/day-4', '/day-5',
  '/intermission',
  '/day-6', '/day-7', '/day-8', '/day-9',
  '/preliminary',
  '/last-day',
  '/appendix/i', '/appendix/ii', '/appendix/iii', '/appendix/iv', '/appendix/v',
  '/glossary',
]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.mjs':  'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.mp3':  'audio/mpeg',
  '.webmanifest': 'application/manifest+json',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        let urlPath = decodeURIComponent(req.url.split('?')[0])
        if (urlPath.startsWith(BASE)) urlPath = urlPath.slice(BASE.length - 1)
        if (urlPath === '' || urlPath === '/') urlPath = '/index.html'
        let filePath = join(DIST, urlPath)
        const isDir = existsSync(filePath) && statSync(filePath).isDirectory()
        if (!existsSync(filePath) || filePath.endsWith('/') || isDir) {
          // SPA fallback: always serve root index.html so the JS bundle takes over routing.
          // Don't serve any pre-rendered day-N/index.html during prerender (otherwise we feed our own output back in).
          if (!extname(urlPath)) {
            filePath = join(DIST, 'index.html')
          } else {
            res.writeHead(404); res.end('404'); return
          }
        }
        const data = await readFile(filePath)
        const ext = extname(filePath).toLowerCase()
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' })
        res.end(data)
      } catch (e) {
        res.writeHead(500); res.end(String(e))
      }
    })
    server.listen(PORT, '127.0.0.1', () => resolve(server))
  })
}

const TPL_PLACEHOLDER = '<div id="root"></div>'

// Keep only the LAST occurrence per dedupe-key (Helmet leaves multiple due to React 18+ double-render).
function dedupeHead(html) {
  const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i)
  if (!headMatch) return html
  const head = headMatch[1]

  // Split into tag fragments
  const tags = []
  const re = /<(title|meta|link)\b[^>]*\/?>(?:[\s\S]*?<\/\1>)?/gi
  let last = 0
  let m
  const segments = []
  while ((m = re.exec(head)) !== null) {
    if (m.index > last) segments.push({ kind: 'raw', text: head.slice(last, m.index) })
    segments.push({ kind: 'tag', text: m[0], name: m[1].toLowerCase() })
    last = m.index + m[0].length
  }
  if (last < head.length) segments.push({ kind: 'raw', text: head.slice(last) })

  // Compute dedupe key per tag
  function keyFor(tag) {
    const t = tag.text
    if (tag.name === 'title') return 'title'
    if (tag.name === 'meta') {
      const name = t.match(/\bname=["']([^"']+)["']/i)?.[1]
      const prop = t.match(/\bproperty=["']([^"']+)["']/i)?.[1]
      const httpEquiv = t.match(/\bhttp-equiv=["']([^"']+)["']/i)?.[1]
      const charset = /\bcharset=/i.test(t)
      if (charset) return 'meta:charset'
      if (name) return 'meta:name:' + name.toLowerCase()
      if (prop) return 'meta:property:' + prop.toLowerCase()
      if (httpEquiv) return 'meta:httpEquiv:' + httpEquiv.toLowerCase()
      return null
    }
    if (tag.name === 'link') {
      const rel = t.match(/\brel=["']([^"']+)["']/i)?.[1]
      const href = t.match(/\bhref=["']([^"']+)["']/i)?.[1]
      const sizes = t.match(/\bsizes=["']([^"']+)["']/i)?.[1]
      const media = t.match(/\bmedia=["']([^"']+)["']/i)?.[1]
      if (!rel) return null
      // multi-occurrence rels can keep multiple but dedupe by href
      if (rel === 'canonical') return 'link:canonical'
      if (rel === 'manifest') return 'link:manifest'
      if (rel === 'icon') return 'link:icon' + (sizes ? ':' + sizes : '')
      // Don't dedupe apple-touch-icon (multi-sizes), preload, alternate, apple-touch-startup-image (multi-media)
      return null
    }
    return null
  }

  // Walk and remember LAST index of each key
  const lastIdxByKey = new Map()
  segments.forEach((s, i) => {
    if (s.kind !== 'tag') return
    const k = keyFor(s)
    if (k) lastIdxByKey.set(k, i)
  })

  const filtered = segments.filter((s, i) => {
    if (s.kind !== 'tag') return true
    const k = keyFor(s)
    if (!k) return true
    return lastIdxByKey.get(k) === i
  })

  const newHead = filtered.map((s) => s.text).join('')
  return html.replace(/<head>[\s\S]*?<\/head>/i, '<head>' + newHead + '</head>')
}

async function prerender() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('dist/index.html missing — run `vite build` first')
    process.exit(1)
  }
  const tpl = await readFile(join(DIST, 'index.html'), 'utf8')
  if (!tpl.includes(TPL_PLACEHOLDER)) {
    console.warn(`warn: template doesn't contain '${TPL_PLACEHOLDER}' — using whole index.html as base`)
  }

  const server = await startStaticServer()
  console.log(`static server: http://127.0.0.1:${PORT}${BASE}`)
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })

  for (const route of ROUTES) {
    const url = `http://127.0.0.1:${PORT}${BASE.replace(/\/$/, '')}${route}`
    const page = await browser.newPage()
    await page.setUserAgent('readThai-prerender/1.0')
    // set lang to ru for indexable content
    await page.evaluateOnNewDocument(() => {
      try { localStorage.setItem('lang', 'ru') } catch (_) {}
    })
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 })
      // wait for first render
      await page.waitForFunction(() => {
        const h = document.querySelector('main h1')
        return !!h && document.readyState === 'complete'
      }, { timeout: 10_000 }).catch(() => {})
      // wait for Helmet to update document.title with chapter-specific value
      const expected = (route === '/' ? 'Читай по-тайски' : 'Читай') // accepted prefix
      await page.waitForFunction(() => {
        const t = document.title || ''
        return t.length > 5
      }, { timeout: 5_000 }).catch(() => {})
      // give helmet additional ticks (React StrictMode double-effect + Helmet async flush)
      await new Promise((r) => setTimeout(r, 1500))

      const docTitle = await page.evaluate(() => document.title)
      console.log('  doc.title:', docTitle)
      let html = await page.content()
      // Helmet/React-19 sometimes leaves stale <title> alongside the updated one.
      // Force the <title> to match what the live document actually shows.
      if (docTitle) {
        // remove all <title>...</title> in head, inject correct one as first child
        html = html.replace(/<title>[\s\S]*?<\/title>/gi, '')
        html = html.replace(/<head>/, '<head><title>' + docTitle.replace(/</g, '&lt;') + '</title>')
      }
      html = dedupeHead(html)
      const outPath = route === '/' ? join(DIST, 'index.html') : join(DIST, route.replace(/^\//, ''), 'index.html')
      await mkdir(dirname(outPath), { recursive: true })
      await writeFile(outPath, html, 'utf8')
      console.log('prerender', route, '->', outPath.replace(DIST + '/', ''))
    } catch (e) {
      console.error('failed', route, e.message)
    } finally {
      await page.close()
    }
  }

  await browser.close()
  server.close()
  console.log('done')
}

prerender().catch((e) => { console.error(e); process.exit(1) })
