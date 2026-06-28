import { useState, useEffect } from 'react'
import { getCustomers, getInteractions } from '../utils/api'
import GlassCard from '../components/ui/GlassCard'
import StatCard from '../components/ui/StatCard'
import MiniBarChart from '../components/ui/MiniBarChart'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import PageHeader from '../components/ui/PageHeader'
import { TrendingUp, Users, Mail, Target, CheckCircle, Clock, AlertTriangle, Zap } from 'lucide-react'

export default function Analytics() {
  const [customers, setCustomers] = useState([])
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCustomers(), getInteractions()])
      .then(([c, i]) => {
        setCustomers(c.customers || [])
        setInteractions(i.interactions || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const total      = interactions.length
  const completed  = interactions.filter(i => i.status === 'completed').length
  const pending    = interactions.filter(i => i.status === 'awaiting_approval').length
  const processing = interactions.filter(i => i.status === 'processing').length

  const avgHealth = customers.length
    ? Math.round(customers.reduce((s, c) => s + (c.health_score || 0), 0) / customers.length)
    : 0

  const resolutionRate = total ? Math.round((completed / total) * 100) : 0

  const healthyCount  = customers.filter(c => c.health_score >= 65).length
  const atRiskCount   = customers.filter(c => c.health_score >= 40 && c.health_score < 65).length
  const criticalCount = customers.filter(c => c.health_score < 40).length

  const sentimentBreakdown = {
    Positive: interactions.filter(i => i.sentiment === 'Positive').length,
    Neutral:  interactions.filter(i => i.sentiment === 'Neutral').length,
    Negative: interactions.filter(i => i.sentiment === 'Negative').length,
  }

  // Group real interactions by day of week from timestamps
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayCounts = Array(7).fill(0)
  interactions.forEach(i => {
    if (i.timestamp) {
      const day = new Date(i.timestamp).getDay()
      dayCounts[day]++
    }
  })
  const weeklyData = dayLabels.map((label, i) => ({ label, value: dayCounts[i] }))

  // Interaction type breakdown from real data
  const typeBreakdown = {}
  interactions.forEach(i => {
    const t = i.interaction_type || 'Unknown'
    typeBreakdown[t] = (typeBreakdown[t] || 0) + 1
  })
  const typeData = Object.entries(typeBreakdown).map(([label, value]) => ({ label: label.split(' ')[0], value }))

  if (loading) return <LoadingSpinner label="Loading analytics..." />

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Analytics & Insights"
        subtitle="Real-time metrics from your customer data"
        badge="Live Data"
      />

      {/* Top stat cards — all real */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Portfolio Health" value={avgHealth || '—'} icon={TrendingUp} color="emerald" delay={0} />
        <StatCard label="Total Customers"  value={customers.length}  icon={Users}      color="blue"   delay={80} />
        <StatCard label="Total Interactions" value={total}           icon={Mail}       color="violet" delay={160} />
        <StatCard label="Pending Actions"  value={pending}           icon={Target}     color="amber"  delay={240} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Interaction volume by day — real timestamps */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Interactions by Day</h3>
              <p className="text-xs text-gray-500">Based on all recorded interactions</p>
            </div>
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          {total === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">No interactions yet</p>
          ) : (
            <MiniBarChart data={weeklyData} height={120} />
          )}
        </GlassCard>

        {/* Sentiment breakdown — real */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-white mb-5">Sentiment Distribution</h3>
          {total === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">No interactions yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(sentimentBreakdown).map(([sentiment, count]) => {
                const totalSentiment = Object.values(sentimentBreakdown).reduce((a, b) => a + b, 0) || 1
                const pct = Math.round((count / totalSentiment) * 100)
                const color = sentiment === 'Positive' ? 'from-emerald-500 to-emerald-400'
                  : sentiment === 'Negative' ? 'from-rose-500 to-rose-400'
                  : 'from-gray-500 to-gray-400'
                return (
                  <div key={sentiment}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-400">{sentiment}</span>
                      <span className="text-white font-medium tabular-nums">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Status breakdown — real */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-white mb-5">Interaction Status Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Completed',        value: completed,  color: 'from-emerald-500 to-emerald-400', icon: CheckCircle,    iconColor: 'text-emerald-400' },
              { label: 'Awaiting Approval',value: pending,    color: 'from-amber-500 to-amber-400',    icon: Clock,          iconColor: 'text-amber-400'   },
              { label: 'Processing',       value: processing, color: 'from-violet-500 to-violet-400',  icon: Zap,            iconColor: 'text-violet-400'  },
              { label: 'New',              value: interactions.filter(i => i.status === 'new').length,
                                                              color: 'from-blue-500 to-blue-400',      icon: Mail,           iconColor: 'text-blue-400'    },
            ].map(({ label, value, color, icon: Icon, iconColor }) => {
              const pct = total ? Math.round((value / total) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                      <span className="text-gray-400">{label}</span>
                    </div>
                    <span className="text-white font-medium tabular-nums">{value} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>

        {/* Customer health breakdown — real */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-white mb-5">Customer Health Distribution</h3>
          <div className="space-y-3">
            {[
              { label: 'Healthy (65+)',   value: healthyCount,  color: 'from-emerald-500 to-emerald-400' },
              { label: 'At Risk (40–64)', value: atRiskCount,   color: 'from-amber-500 to-amber-400'    },
              { label: 'Critical (<40)',  value: criticalCount, color: 'from-rose-500 to-rose-400'       },
            ].map(({ label, value, color }) => {
              const pct = customers.length ? Math.round((value / customers.length) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white font-medium tabular-nums">{value} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-3">
            {[
              { label: 'Avg Health', value: avgHealth || '—', color: 'text-white' },
              { label: 'Critical',   value: criticalCount,    color: 'text-rose-400' },
              { label: 'Resolution', value: `${resolutionRate}%`, color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-2 rounded-lg bg-white/[0.02]">
                <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Interaction type chart — real */}
      {typeData.length > 0 && (
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Interactions by Type</h3>
          </div>
          <MiniBarChart data={typeData} height={100} />
        </GlassCard>
      )}
    </div>
  )
}