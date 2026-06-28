import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Mail,
  PlusCircle,
  Users,
  BarChart3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { BRAND } from '../../utils/brand'
import { useTheme } from '../../context/ThemeContext'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers',  icon: Users,           label: 'Customers' },
  { to: '/emails',     icon: Mail,            label: 'Inbox Monitor' },
  { to: '/analyze',    icon: PlusCircle,      label: 'Analyze' },
  { to: '/analytics',  icon: BarChart3,       label: 'Analytics' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <aside
      className={`${collapsed ? 'w-[72px]' : 'w-64'} shrink-0 flex flex-col transition-all duration-300 backdrop-blur-xl ${
        isDark
          ? 'border-r border-white/[0.08] bg-surface-raised/80'
          : 'border-r border-violet-100 bg-white/80'
      }`}
    >
      {/* Logo */}
      <div className={`py-5 border-b ${isDark ? 'border-white/[0.08]' : 'border-violet-100'} ${collapsed ? 'px-3' : 'px-4'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {BRAND.name}
              </p>
              <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {BRAND.tagline}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {!collapsed && (
          <p className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Platform
          </p>
        )}
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'nav-link-active'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                    : 'text-gray-500 hover:text-violet-700 hover:bg-violet-50'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={`px-3 py-4 border-t space-y-3 ${isDark ? 'border-white/[0.08]' : 'border-violet-100'}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
            isDark
              ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.05]'
              : 'text-gray-400 hover:text-violet-700 hover:bg-violet-50'
          }`}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4" /> Collapse</>
          }
        </button>
        {!collapsed && (
          <p className={`text-[10px] text-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            XLVentures.AI © 2026
          </p>
        )}
      </div>
    </aside>
  )
}