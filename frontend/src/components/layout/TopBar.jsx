import { useLocation } from 'react-router-dom'
import { Bell, RefreshCw } from 'lucide-react'
import { useState } from 'react'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard',            subtitle: 'Overview of all customer interactions' },
  '/emails':    { title: 'Email Monitor',         subtitle: 'Live Gmail inbox — auto-refreshes every 5s' },
  '/analyze':   { title: 'Analyze Interaction',   subtitle: 'Manually submit a customer interaction for analysis' },
}

export default function TopBar() {
  const location  = useLocation()
  const [time, setTime] = useState(new Date().toLocaleTimeString())

  const info = PAGE_TITLES[location.pathname] || {
    title:    'Customer Success AI',
    subtitle: 'Intelligent Next Best Action Platform',
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{info.title}</h1>
        <p className="text-sm text-gray-500">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">{new Date().toLocaleDateString()}</span>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">CS</span>
        </div>
      </div>
    </div>
  )
}