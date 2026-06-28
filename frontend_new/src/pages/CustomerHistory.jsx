import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCustomerHistory } from '../utils/api'
import StatusBadge from '../components/ui/StatusBadge'
import GlassCard from '../components/ui/GlassCard'
import HealthRing from '../components/ui/HealthRing'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { ArrowLeft, Calendar, Brain, Mail, AlertTriangle, Sparkles } from 'lucide-react'

export default function CustomerHistory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCustomerHistory(id).then(setData).finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner label="Loading customer profile..." />
  if (!data) return <p className="text-gray-500 text-center py-12">Customer not found.</p>

  const { customer, interactions, memory } = data
  const histCtx = memory?.historical_context || {}

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Customer header */}
      <GlassCard className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {customer.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{customer.name}</h2>
              <p className="text-gray-400">{customer.company}</p>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {customer.email}
              </p>
            </div>
          </div>
          <div className="text-center shrink-0">
            <HealthRing score={customer.health_score || 0} size={88} strokeWidth={6} />
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Health Score</p>
            {customer.renewal_date && (
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 justify-center">
                <Calendar className="w-3 h-3" />
                Renews {new Date(customer.renewal_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </GlassCard>

      {/* AI Memory */}
      {memory && (
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Memory Summary</h3>
              <p className="text-xs text-gray-500">Persistent context from all interactions</p>
            </div>
            <Sparkles className="w-4 h-4 text-violet-400 ml-auto" />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed mb-5">{memory.summary}</p>

          {histCtx.key_issues?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Key Issues</p>
              <ul className="space-y-2">
                {histCtx.key_issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300 bg-rose-500/5 border border-rose-500/10 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {histCtx.renewal_risk && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              histCtx.renewal_risk?.includes('HIGH')
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : histCtx.renewal_risk?.includes('MEDIUM')
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              Renewal Risk: {histCtx.renewal_risk}
            </div>
          )}
        </GlassCard>
      )}

      {/* Timeline */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-semibold text-white mb-5">
          Interaction Timeline
          <span className="ml-2 text-gray-500 font-normal">({interactions.length})</span>
        </h3>
        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/[0.08]" />
          <div className="space-y-4">
            {interactions.map((i, idx) => (
              <div
                key={i.id}
                onClick={() => navigate(`/interactions/${i.id}`)}
                className="flex gap-4 cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  idx === 0
                    ? 'bg-violet-500/20 border-violet-500/40'
                    : 'bg-white/[0.03] border-white/[0.08] group-hover:bg-violet-500/10 group-hover:border-violet-500/30'
                }`}>
                  <span className="text-xs font-bold text-violet-400">{idx + 1}</span>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] group-hover:bg-white/[0.04] group-hover:border-white/[0.08] transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-violet-200 transition-colors">{i.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {i.interaction_type} · {new Date(i.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <StatusBadge status={i.status} />
                  </div>
                </div>
              </div>
            ))}
            {interactions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">No interactions recorded yet.</p>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
