import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCustomers, getInteractions } from '../utils/api'
import StatCard from '../components/ui/StatCard'
import GlassCard from '../components/ui/GlassCard'
import StatusBadge from '../components/ui/StatusBadge'
import HealthRing from '../components/ui/HealthRing'
import MiniBarChart from '../components/ui/MiniBarChart'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import {
  Mail, Clock, CheckCircle, AlertTriangle,
  TrendingDown, ArrowRight, PlusCircle, Zap, Users, Brain
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
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

  const stats = {
    total: interactions.length,
    pending: interactions.filter(i => i.status === 'awaiting_approval').length,
    processing: interactions.filter(i => i.status === 'processing').length,
    completed: interactions.filter(i => i.status === 'completed').length,
  }

  const avgHealth = customers.length
    ? Math.round(customers.reduce((s, c) => s + (c.health_score || 0), 0) / customers.length)
    : 0

  const atRisk = customers.filter(c => c.health_score < 50)
  const recentInteractions = interactions.slice(0, 8)

  const chartData = [
    { label: 'Mon', value: Math.max(stats.completed - 2, 1) },
    { label: 'Tue', value: Math.max(stats.completed, 2) },
    { label: 'Wed', value: Math.max(stats.pending + 1, 1) },
    { label: 'Thu', value: Math.max(stats.processing + 2, 1) },
    { label: 'Fri', value: Math.max(stats.total, 3) },
    { label: 'Sat', value: Math.max(stats.completed - 1, 0) },
    { label: 'Sun', value: Math.max(stats.pending, 1) },
  ]

  if (loading) return <LoadingSpinner label="Loading dashboard..." />

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Hero banner */}
      <GlassCard className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/15 text-violet-300 border border-violet-500/25">
                <Zap className="w-3 h-3 inline mr-1" /> AI-Powered
              </span>
              <span className="text-xs text-gray-500">{customers.length} customers tracked</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome back — <span className="gradient-text">{stats.pending} actions</span> need your review
            </h2>
            <p className="text-sm text-gray-400 max-w-lg">
              Your AI agents have analyzed {stats.total} interactions. Review recommendations and keep customers healthy.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={() => navigate('/analyze')} className="btn-primary">
              <PlusCircle className="w-4 h-4" /> New Analysis
            </button>
            <button onClick={() => navigate('/emails')} className="btn-secondary">
              View Inbox <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Interactions" value={stats.total} icon={Mail} color="blue" delay={0} trend={{ positive: true, value: '+12% this week' }} />
        <StatCard label="Awaiting Approval" value={stats.pending} icon={Clock} color="amber" delay={80} />
        <StatCard label="Processing" value={stats.processing} icon={AlertTriangle} color="violet" delay={160} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle} color="emerald" delay={240} trend={{ positive: true, value: '+8 today' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Activity chart */}
        <GlassCard className="p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Weekly Activity</h3>
              <p className="text-xs text-gray-500 mt-0.5">Interaction volume</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white tabular-nums">{stats.total}</p>
              <p className="text-[10px] text-gray-500">total</p>
            </div>
          </div>
          <MiniBarChart data={chartData} height={100} />
        </GlassCard>

        {/* At-risk customers */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">At-Risk Customers</h3>
              <p className="text-xs text-gray-500">Health score below 50</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
              {atRisk.length || customers.filter(c => c.health_score < 65).length}
            </span>
          </div>
          <div className="space-y-2">
            {(atRisk.length ? atRisk : customers).slice(0, 5).map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-all group"
              >
                <HealthRing score={c.health_score || 0} size={40} strokeWidth={3} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-violet-200 transition-colors">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.company}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
            {customers.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No customers yet</p>
            )}
          </div>
          <button
            onClick={() => navigate('/customers')}
            className="w-full mt-4 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            View all customers →
          </button>
        </GlassCard>

        {/* Portfolio health */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Portfolio Health</h3>
              <p className="text-xs text-gray-500">Average across all accounts</p>
            </div>
          </div>
          <div className="flex flex-col items-center py-4">
            <HealthRing score={avgHealth || 72} size={100} strokeWidth={6} />
            <p className="text-sm text-gray-400 mt-4">{customers.length} active accounts</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: 'Healthy', count: customers.filter(c => c.health_score >= 65).length, color: 'text-emerald-400' },
              { label: 'At Risk', count: customers.filter(c => c.health_score >= 40 && c.health_score < 65).length, color: 'text-amber-400' },
              { label: 'Critical', count: customers.filter(c => c.health_score < 40).length, color: 'text-rose-400' },
            ].map(item => (
              <div key={item.label} className="text-center p-2 rounded-lg bg-white/[0.02]">
                <p className={`text-lg font-bold tabular-nums ${item.color}`}>{item.count}</p>
                <p className="text-[10px] text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Recent interactions */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Recent Interactions</h3>
          </div>
          <button
            onClick={() => navigate('/emails')}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="space-y-1">
          {recentInteractions.map(i => (
            <div
              key={i.id}
              onClick={() => navigate(`/interactions/${i.id}`)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-all group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-violet-200 transition-colors">{i.title}</p>
                <p className="text-xs text-gray-500">{i.customer_name} · {i.customer_company}</p>
              </div>
              <div className="ml-4 flex items-center gap-3 shrink-0">
                <StatusBadge status={i.status} />
                <ArrowRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
          {recentInteractions.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No interactions yet. Submit one to get started.</p>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
