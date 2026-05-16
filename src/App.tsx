import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { ChapterPage } from '@/pages/ChapterPage'

const BASENAME = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/'

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

export default function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <GhPagesSpaRedirect />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<ChapterPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
