import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { MobileTabBar } from './MobileTabBar'
import { LessonsSheet } from './LessonsSheet'
import { SettingsSheet } from './SettingsSheet'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { AudioController } from '@/components/audio/AudioController'
import { MiniPlayer } from '@/components/audio/MiniPlayer'
import { NowPlayingSheet } from '@/components/audio/NowPlayingSheet'

export function Layout() {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lessonsOpen, setLessonsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  if (isMobile) {
    return (
      <div className="relative flex min-h-[100dvh] flex-col">
        <AudioController />
        <MobileHeader onOpenSettings={() => setSettingsOpen(true)} />
        <main
          className="min-w-0 flex-1 px-4 pt-3"
          style={{ paddingBottom: 'calc(var(--tabbar-total) + 96px)' }}
        >
          <Outlet />
        </main>
        <MiniPlayer />
        <MobileTabBar
          onOpenLessons={() => setLessonsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          lessonsOpen={lessonsOpen}
          settingsOpen={settingsOpen}
        />
        <LessonsSheet open={lessonsOpen} onClose={() => setLessonsOpen(false)} />
        <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <NowPlayingSheet />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AudioController />
      <Header
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
      />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 px-4 py-8 md:px-8 lg:px-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
