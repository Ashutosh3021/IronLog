import { useEffect, useRef } from 'react'
import { useIronLog } from './context/IronLogContext'
import type { PageId } from './lib/types'
import { BottomNav } from './components/BottomNav'
import { TopBar } from './components/TopBar'
import { Modal } from './components/Modal'
import { Toast } from './components/Toast'
import { HomePage } from './pages/HomePage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { CalcPage } from './pages/CalcPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'

const pages: PageId[] = ['home', 'analytics', 'calc', 'history', 'settings']

export default function App() {
  const { page, setPage } = useIronLog()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab && pages.includes(tab as PageId)) setPage(tab as PageId)
  }, [setPage])

  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
  }, [page])

  return (
    <>
      <TopBar />
      <div className="content" ref={contentRef}>
        <div className={`page${page === 'home' ? ' active' : ''}`}>
          <HomePage />
        </div>
        <div className={`page${page === 'analytics' ? ' active' : ''}`}>
          <AnalyticsPage visible={page === 'analytics'} />
        </div>
        <div className={`page${page === 'calc' ? ' active' : ''}`}>
          <CalcPage />
        </div>
        <div className={`page${page === 'history' ? ' active' : ''}`}>
          <HistoryPage />
        </div>
        <div className={`page${page === 'settings' ? ' active' : ''}`}>
          <SettingsPage />
        </div>
      </div>
      <BottomNav />
      <Toast />
      <Modal />
    </>
  )
}
