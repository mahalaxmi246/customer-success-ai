import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCustomers } from '../utils/api'
import GlassCard from '../components/ui/GlassCard'
import HealthRing from '../components/ui/HealthRing'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import { Search, Users, ArrowRight, Calendar, Filter } from 'lucide-react'

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getCustomers()
      .then(d => setCustomers(d.customers || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c => {
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ? true :
      filter === 'healthy' ? c.health_score >= 65 :
      filter === 'at-risk' ? c.health_score >= 40 && c.health_score < 65 :
      c.health_score < 40
    return matchSearch && matchFilter
  })

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'healthy', label: 'Healthy' },
    { id: 'at-risk', label: 'At Risk' },
    { id: 'critical', label: 'Critical' },
  ]

  if (loading) return <LoadingSpinner label="Loading customers..." />

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Customer Portfolio"
        subtitle={`${customers.length} accounts under AI monitoring`}
        badge="Live Health Tracking"
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="input-field pl-10 w-64"
            />
          </div>
        }
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.id
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-gray-500">
              ({f.id === 'all' ? customers.length :
                f.id === 'healthy' ? customers.filter(c => c.health_score >= 65).length :
                f.id === 'at-risk' ? customers.filter(c => c.health_score >= 40 && c.health_score < 65).length :
                customers.filter(c => c.health_score < 40).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={Users}
            title="No customers found"
            description={search ? 'Try adjusting your search or filters.' : 'Customers will appear here once synced from your CRM.'}
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <GlassCard
              key={c.id}
              hover
              onClick={() => navigate(`/customers/${c.id}`)}
              className="p-5 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-violet-300">
                      {c.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{c.company}</p>
                  </div>
                </div>
                <HealthRing score={c.health_score || 0} size={48} strokeWidth={4} />
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {c.renewal_date
                    ? `Renews ${new Date(c.renewal_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                    : 'No renewal date'}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 transition-colors" />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
