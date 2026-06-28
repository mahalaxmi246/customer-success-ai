import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getInteraction, approveInteraction, analyzeInteraction } from '../utils/api'
import RecommendationCard from '../components/ui/RecommendationCard'
import StatusBadge from '../components/ui/StatusBadge'
import GlassCard from '../components/ui/GlassCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { ArrowLeft, RefreshCw, CheckCircle, Loader, User, Sparkles, Bot } from 'lucide-react'

const AGENT_STEPS = [
  { name: 'Sentiment Analyzer', desc: 'Detecting emotional tone' },
  { name: 'Intent Classifier', desc: 'Identifying customer goals' },
  { name: 'Memory Retriever', desc: 'Loading customer history' },
  { name: 'Action Planner', desc: 'Generating recommendations' },
]

export default function RecommendationView() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [interaction, setInteraction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [decisions, setDecisions] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [submitSuccess, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [agentStep, setAgentStep] = useState(0)

  const fetchInteraction = async () => {
    try {
      const data = await getInteraction(id)
      setInteraction(data)
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInteraction()
    const interval = setInterval(() => {
      if (interaction?.status === 'processing' || interaction?.status === 'new') {
        fetchInteraction()
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [id, interaction?.status])

  useEffect(() => {
    if (interaction?.status === 'processing' || interaction?.status === 'new') {
      const stepInterval = setInterval(() => {
        setAgentStep(s => (s + 1) % AGENT_STEPS.length)
      }, 2000)
      return () => clearInterval(stepInterval)
    }
  }, [interaction?.status])

  const handleDecision = (decision) => {
    setDecisions(prev => {
      const exists = prev.findIndex(d => d.recommendation_id === decision.recommendation_id)
      if (exists >= 0) {
        const updated = [...prev]
        updated[exists] = decision
        return updated
      }
      return [...prev, decision]
    })
  }

  const handleSubmitAll = async () => {
    if (decisions.length === 0) {
      setError('Please make a decision on at least one recommendation.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await approveInteraction(id, decisions)
      setSubmitted(true)
      setSuccess(true)
      // Wait then refresh so API has time to commit
      setTimeout(async () => {
        await fetchInteraction()
      }, 500)
      setTimeout(() => navigate('/emails'), 2500)
    } catch (e) {
      setError(e.response?.data?.detail || 'Submission failed.')
      setSubmitting(false)
    }
  }

  const handleReanalyze = async () => {
    setLoading(true)
    await analyzeInteraction(id)
    setTimeout(fetchInteraction, 2000)
  }

  if (loading) return <LoadingSpinner label="Loading recommendations..." />
  if (!interaction) return <p className="text-gray-500 text-center py-12">Interaction not found.</p>

  const recs = interaction.recommendations || []
  const isProcessing = ['new', 'processing'].includes(interaction.status)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <StatusBadge status={interaction.status} />
              <span className="text-xs text-gray-500">{interaction.interaction_type} · {interaction.source}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{interaction.title}</h2>
            <button
              onClick={() => navigate(`/customers/${interaction.customer_id}`)}
              className="flex items-center gap-2 mt-2 text-sm text-gray-400 hover:text-violet-300 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              {interaction.customer_name} · {interaction.customer_company}
              {interaction.health_score !== undefined && (
                <span className={`text-xs font-bold ml-1 ${
                  interaction.health_score < 40 ? 'text-rose-400'
                  : interaction.health_score < 65 ? 'text-amber-400'
                  : 'text-emerald-400'
                }`}>
                  · {interaction.health_score} health
                </span>
              )}
            </button>
          </div>
          {interaction.status === 'awaiting_approval' && (
            <button onClick={handleReanalyze} className="btn-secondary text-xs shrink-0">
              <RefreshCw className="w-3 h-3" /> Re-analyze
            </button>
          )}
        </div>

        <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{interaction.content}</p>
        </div>
      </GlassCard>

      {/* Processing animation */}
      {isProcessing && (
        <GlassCard className="p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-cyan-500/5 to-violet-500/5 animate-gradient-x" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mx-auto mb-5 animate-pulse-glow">
              <Bot className="w-8 h-8 text-violet-400" />
            </div>
            <p className="text-white font-semibold mb-1">AI agents are analyzing this interaction</p>
            <p className="text-sm text-gray-400 mb-6">This page will update automatically</p>

            <div className="max-w-sm mx-auto space-y-2">
              {AGENT_STEPS.map((step, i) => (
                <div
                  key={step.name}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                    i === agentStep ? 'bg-violet-500/15 border border-violet-500/30' : 'opacity-40'
                  }`}
                >
                  {i < agentStep ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : i === agentStep ? (
                    <Loader className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                  )}
                  <div className="text-left">
                    <p className="text-xs font-medium text-white">{step.name}</p>
                    <p className="text-[10px] text-gray-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Recommendations */}
      {recs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">
              {interaction.status === 'completed'
                ? `${recs.filter(r => ['approved','edited'].includes(r.decisions?.[0]?.decision)).length} Approved Action${recs.filter(r => ['approved','edited'].includes(r.decisions?.[0]?.decision)).length !== 1 ? 's' : ''}`
                : `${recs.length} Next Best Action${recs.length > 1 ? 's' : ''} — Review & Decide`
              }
            </h3>
          </div>

          {recs
            .filter(rec => {
              if (interaction.status === 'completed') {
                const decision = rec.decisions?.[0]?.decision
                return decision === 'approved' || decision === 'edited'
              }
              return true
            })
            .map(rec => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onDecision={handleDecision}
                disabled={submitted || interaction.status === 'completed'}
                existingDecision={rec.decisions?.[0] || null}
              />
            ))
          }

          {interaction.status === 'awaiting_approval' && !submitted && (
            <GlassCard className="p-5">
              {error && (
                <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                  <p className="text-sm text-rose-300">{error}</p>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-400">
                  <span className="text-white font-medium">{decisions.length}</span> of {recs.length} decisions made
                </p>
                <button
                  onClick={handleSubmitAll}
                  disabled={submitting || decisions.length === 0}
                  className="btn-primary"
                >
                  {submitting
                    ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
                    : <><CheckCircle className="w-4 h-4" /> Submit All Decisions</>
                  }
                </button>
              </div>
            </GlassCard>
          )}

          {submitted && (
            <GlassCard className="p-6 text-center border-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-emerald-300 font-semibold">Decisions saved! Memory updated.</p>
              <p className="text-gray-500 text-sm mt-1">Redirecting to inbox...</p>
            </GlassCard>
          )}
        </div>
      )}

      {recs.length === 0 && interaction.status === 'completed' && (
        <GlassCard className="p-8 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">This interaction has been completed.</p>
        </GlassCard>
      )}
    </div>
  )
}
