import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import AnimatedBackground from '../ui/AnimatedBackground'
import { isAuthenticated } from '../../utils/auth'
import { useTheme } from '../../context/ThemeContext'

export default function AppLayout() {
  const { theme } = useTheme()

  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'light' ? 'bg-[#f5f4ff]' : ''}`}>
      <AnimatedBackground />
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}