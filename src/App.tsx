import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { ChapterPage } from '@/pages/ChapterPage'
import { GlossaryPage } from '@/pages/GlossaryPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="glossary" element={<GlossaryPage />} />
          <Route path="*" element={<ChapterPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
