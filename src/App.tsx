import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { ChapterPage } from '@/pages/ChapterPage'

const BASENAME = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/'
const YM_ID = 109258732

function GhPagesSpaRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('p')
    const q = params.get('q')
    if (p !== null) {
      const target =
        BASENAME +
        (p.startsWith('/') ? p : '/' + p) +
        (q ? '?' + q : '') +
        window.location.hash
      window.history.replaceState(null, '', target)
    }
  }, [])
  return null
}

function YandexMetrikaTracker() {
  const location = useLocation()
  const prevPath = useRef<string | null>(null)
  useEffect(() => {
    const path = location.pathname + location.search + location.hash
    if (typeof window === 'undefined' || typeof window.ym !== 'function') return
    if (prevPath.current === null) {
      prevPath.current = path
      return
    }
    if (prevPath.current === path) return
    const from = prevPath.current
    prevPath.current = path
    window.ym(YM_ID, 'hit', window.location.href, {
      title: document.title,
      referer: window.location.origin + from,
    })
  }, [location])
  return null
}

export default function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <GhPagesSpaRedirect />
      <YandexMetrikaTracker />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<ChapterPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
