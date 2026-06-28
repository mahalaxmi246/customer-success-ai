import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInteractions } from '../hooks/useInteractions'
import InteractionRow from '../components/ui/InteractionRow'
import GlassCard from '../components/ui/GlassCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { RefreshCw, Mail, Radio } from 'lucide-react'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'processing', label: 'Processing' },
  { id: 'awaiting_approval', label: 'Awaiting' },
  { id: 'completed', label: 'Completed' },
]

export default function EmailMonitor() {
  const navigate = useNavigate()
  const { interactions, loading, error, refetch } = useInteractions({}, 5000)
  const [activeTab, setActiveTab] = useState('all')

  const filtered = activeTab === 'all'
    ? interactions
    : interactions.filter(i => i.status === activeTab)

  if (error) return (
    <GlassCard className="p-8 text-center">
      <p className="text-rose-400 font-medium">Failed to load interactions</p>
      <p className="text-gray-500 text-sm mt-1">{error}</p>
      <button onClick={refetch} className="btn-secondary mt-4">Retry</button>
    </GlassCard>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Live header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Live Feed</span>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
          </div>
          <span className="text-xs text-gray-500">Auto-refreshing every 5s · {interactions.length} total</span>
        </div>
        <button onClick={refetch} className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className="ml-1.5 opacity-60">
                ({interactions.filter(i => i.status === tab.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading interactions..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No interactions found"
            description={
              activeTab === 'all'
                ? 'Waiting for new emails or manual interactions.'
                : `No interactions with status "${TABS.find(t => t.id === activeTab)?.label}".`
            }
            action={
              <button onClick={() => navigate('/analyze')} className="btn-primary">
                Submit Interaction
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Interaction', 'Customer', 'Sentiment', 'Status', 'Time'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <InteractionRow key={i.id} interaction={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
