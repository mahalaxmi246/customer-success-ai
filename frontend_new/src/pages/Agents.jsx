import { useState, useEffect } from 'react'
import GlassCard from '../components/ui/GlassCard'
import PageHeader from '../components/ui/PageHeader'
import {
  Bot, Brain, Mail, Search, Zap, CheckCircle,
  Loader, Activity, Sparkles
} from 'lucide-react'

const AGENTS = [
  {
    id: 'ingestion',
    name: 'Ingestion Agent',
    icon: Mail,
    color: 'blue',
    description: 'Monitors Gmail inbox and ingests new customer emails in real-time',
    status: 'active',
    tasks: 847,
    latency: '120ms',
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analyzer',
    icon: Brain,
    color: 'violet',
    description: 'Detects emotional tone, urgency, and customer satisfaction signals',
    status: 'active',
    tasks: 623,
    latency: '340ms',
  },
  {
    id: 'intent',
    name: 'Intent Classifier',
    icon: Search,
    color: 'cyan',
    description: 'Classifies customer intent: renewal, complaint, feature request, etc.',
    status: 'active',
    tasks: 598,
    latency: '280ms',
  },
  {
    id: 'memory',
    name: 'Memory Retriever',
    icon: Activity,
    color: 'amber',
    description: 'Retrieves persistent customer context and interaction history',
    status: 'active',
    tasks: 512,
    latency: '190ms',
  },
  {
    id: 'planner',
    name: 'Action Planner',
    icon: Sparkles,
    color: 'emerald',
    description: 'Generates ranked next-best-actions with execution plans',
    status: 'active',
    tasks: 445,
    latency: '1.2s',
  },
  {
    id: 'executor',
    name: 'Execution Agent',
    icon: Zap,
    color: 'rose',
    description: 'Executes approved actions: drafts emails, schedules meetings',
    status: 'idle',
    tasks: 234,
    latency: '890ms',
  },
]

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/30'    },
  violet:  { bg: 'bg-violet-500/15',  text: 'text-violet-400',  border: 'border-violet-500/30'  },
  cyan:    { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/30'    },
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30'   },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  rose:    { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30'    },
}

const ACTIVITY_LOG = [
  { time: '2s ago', agent: 'Ingestion Agent', action: 'New email from acme@corp.com ingested', status: 'success' },
  { time: '5s ago', agent: 'Sentiment Analyzer', action: 'Detected negative sentiment (0.87 confidence)', status: 'success' },
  { time: '8s ago', agent: 'Intent Classifier', action: 'Classified as "Renewal Concern"', status: 'success' },
  { time: '12s ago', agent: 'Memory Retriever', action: 'Loaded 14 prior interactions for customer', status: 'success' },
  { time: '15s ago', agent: 'Action Planner', action: 'Generated 3 ranked recommendations', status: 'success' },
  { time: 'now', agent: 'Execution Agent', action: 'Awaiting human approval...', status: 'pending' },
]

export default function Agents() {
  const [activeAgent, setActiveAgent] = useState(null)
  const [logIndex, setLogIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setLogIndex(i => (i + 1) % ACTIVITY_LOG.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const activeCount = AGENTS.filter(a => a.status === 'active').length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="AI Agent Pipeline"
        subtitle={`${activeCount} of ${AGENTS.length} agents active · Multi-agent orchestration`}
        badge="Autonomous System"
      />

      {/* Pipeline overview */}
      <GlassCard className="p-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
        <div className="relative flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {AGENTS.map((agent, i) => {
            const colors = COLOR_MAP[agent.color]
            const Icon = agent.icon
            return (
              <div key={agent.id} className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveAgent(activeAgent === agent.id ? null : agent.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-w-[90px] ${
                    activeAgent === agent.id
                      ? `${colors.bg} border ${colors.border}`
                      : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center relative`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                    {agent.status === 'active' && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-surface" />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 text-center leading-tight">{agent.name.split(' ')[0]}</span>
                </button>
                {i < AGENTS.length - 1 && (
                  <div className="flex items-center gap-0.5 px-1">
                    {[...Array(3)].map((_, j) => (
                      <div
                        key={j}
                        className="w-1 h-1 rounded-full bg-violet-500/40 animate-pulse"
                        style={{ animationDelay: `${j * 200 + i * 100}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENTS.map((agent, i) => {
            const colors = COLOR_MAP[agent.color]
            const Icon = agent.icon
            return (
              <GlassCard
                key={agent.id}
                hover
                onClick={() => setActiveAgent(agent.id)}
                className={`p-5 animate-slide-up ${activeAgent === agent.id ? 'ring-1 ring-violet-500/50' : ''}`}
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        agent.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-gray-500/15 text-gray-400'
                      }`}>
                        {agent.status === 'active' ? (
                          <><span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" /> Active</>
                        ) : 'Idle'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{agent.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.06]">
                  <div>
                    <p className="text-xs text-gray-500">Tasks</p>
                    <p className="text-sm font-bold text-white tabular-nums">{agent.tasks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Latency</p>
                    <p className="text-sm font-bold text-white font-mono">{agent.latency}</p>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>

        {/* Live activity feed */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Bot className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Live Activity</h3>
            <span className="relative flex h-2 w-2 ml-auto">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
          </div>
          <div className="space-y-3">
            {ACTIVITY_LOG.map((log, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl transition-all ${
                  i === logIndex ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-white/[0.02]'
                }`}
              >
                <div className="flex items-start gap-2">
                  {log.status === 'success'
                    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    : <Loader className="w-3.5 h-3.5 text-amber-400 animate-spin mt-0.5 shrink-0" />
                  }
                  <div>
                    <p className="text-[10px] text-gray-500">{log.time} · {log.agent}</p>
                    <p className="text-xs text-gray-300 mt-0.5">{log.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
