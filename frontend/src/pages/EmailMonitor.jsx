import { useNavigate } from 'react-router-dom'
import { useInteractions } from '../hooks/useInteractions'
import InteractionRow from '../components/ui/InteractionRow'
import { RefreshCw, Mail } from 'lucide-react'

export default function EmailMonitor() {
  const navigate = useNavigate()
  const { interactions, total, loading, error, refetch } = useInteractions({}, 5000)

  const tabs = ['all', 'new', 'processing', 'awaiting_approval', 'completed']
  const [activeTab, setActiveTab] = useState('all')

  const filtered = activeTab === 'all'
    ? interactions
    : interactions.filter(i => i.status === activeTab)

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p className="text-red-600 font-medium">Failed to load interactions</p>
      <p className="text-red-500 text-sm mt-1">{error}</p>
      <button onClick={refetch} className="mt-3 text-sm text-red-600 underline">Retry</button>
    </div>
  )

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">Live — auto-refreshing every 5s</span>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.replace('_', ' ')}
            {tab !== 'all' && (
              <span className="ml-1.5 text-gray-400">
                ({interactions.filter(i => i.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No interactions found</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'all'
                ? 'Waiting for new emails or manual interactions.'
                : `No interactions with status "${activeTab.replace('_', ' ')}".`}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Interaction', 'Customer', 'Sentiment', 'Status', 'Time'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(i => (
                <InteractionRow key={i.id} interaction={i} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'