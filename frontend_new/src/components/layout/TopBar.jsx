import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Command, Zap, LogOut, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getUser, getInitials, logout } from '../../utils/auth'
import { BRAND } from '../../utils/brand'
import { useTheme } from '../../context/ThemeContext'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Real-time overview of customer health & interactions' },
  '/customers': { title: 'Customers', subtitle: 'Manage and monitor your customer portfolio' },
  '/emails':    { title: 'Inbox Monitor', subtitle: 'Live interaction feed — auto-refreshes every 5s' },
  '/analyze':   { title: 'Analyze Interaction', subtitle: 'Submit customer interactions for AI analysis' },
  '/analytics': { title: 'Analytics', subtitle: 'Insights, trends, and performance metrics' },
}

function getPageInfo(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/customers/')) return { title: 'Customer Profile', subtitle: 'History, memory, and interaction timeline' }
  if (pathname.startsWith('/interactions/')) return { title: 'Recommendation Review', subtitle: 'Review AI-generated next best actions' }
  return { title: BRAND.name, subtitle: BRAND.tagline }
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const user = getUser()
  const isDark = theme === 'dark'

  const info = getPageInfo(location.pathname)

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const quickLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Analyze Interaction', path: '/analyze' },
    { label: 'Inbox Monitor', path: '/emails' },
    { label: 'Customers', path: '/customers' },
    { label: 'Analytics', path: '/analytics' },
  ]

  const filtered = quickLinks.filter(l =>
    l.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <header className={`shrink-0 px-6 py-4 backdrop-blur-xl border-b ${
        isDark
          ? 'border-white/[0.08] bg-surface-raised/60'
          : 'border-violet-100 bg-white/70'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className={`text-lg font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {info.title}
            </h1>
            <p className={`text-sm truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {info.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                isDark
                  ? 'bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-gray-300 hover:bg-white/[0.06]'
                  : 'bg-violet-50 border border-violet-200 text-gray-500 hover:text-violet-700 hover:bg-violet-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search...</span>
              <kbd className={`ml-4 px-1.5 py-0.5 rounded text-[10px] font-mono ${
                isDark ? 'bg-white/[0.06] text-gray-500' : 'bg-violet-100 text-gray-400'
              }`}>⌘K</kbd>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              title="Toggle theme"
              className={`p-2.5 rounded-xl border transition-all ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  : 'bg-violet-50 border-violet-200 text-gray-500 hover:text-violet-700 hover:bg-violet-100'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user?.company && (
              <span className={`hidden sm:block text-xs max-w-[140px] truncate ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {user.company}
              </span>
            )}

            <button
              onClick={handleLogout}
              title="Sign out"
              className={`p-2.5 rounded-xl border transition-all ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  : 'bg-violet-50 border-violet-200 text-gray-500 hover:text-violet-700 hover:bg-violet-100'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-xs text-white font-bold">{getInitials(user?.name)}</span>
            </div>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <div
            className={`absolute inset-0 ${isDark ? 'bg-black/60' : 'bg-black/20'} backdrop-blur-sm`}
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative w-full max-w-lg glass-card overflow-hidden animate-slide-up shadow-2xl">
            <div className={`flex items-center gap-3 px-4 py-3 border-b ${
              isDark ? 'border-white/[0.08]' : 'border-violet-100'
            }`}>
              <Command className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search pages and actions..."
                className={`flex-1 bg-transparent text-sm placeholder:text-gray-400 focus:outline-none ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}
              />
              <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                isDark ? 'bg-white/[0.06] text-gray-500' : 'bg-violet-100 text-gray-400'
              }`}>ESC</kbd>
            </div>
            <div className="py-2 max-h-64 overflow-y-auto">
              {filtered.map(link => (
                <button
                  key={link.path}
                  onClick={() => { navigate(link.path); setSearchOpen(false); setSearchQuery('') }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                    isDark
                      ? 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
                      : 'text-gray-600 hover:bg-violet-50 hover:text-violet-700'
                  }`}
                >
                  <Zap className="w-4 h-4 text-violet-400" />
                  {link.label}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className={`px-4 py-6 text-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No results found
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}