import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getInteraction, approveInteraction, analyzeInteraction } from '../utils/api'
import RecommendationCard from '../components/ui/RecommendationCard'
import StatusBadge from '../components/ui/StatusBadge'
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Loader, User } from 'lucide-react'

export default function RecommendationView() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [interaction, setInteraction] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [decisions, setDecisions]     = useState([])
  const [submitted, setSubmitted]     = useState(false)
  const [submitSuccess, setSuccess]   = useState(false)
  const [error, setError]             = useState(null)

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
    // Poll if still processing
    const interval = setInterval(() => {
      if (interaction?.status === 'processing' || interaction?.status === 'new') {
        fetchInteraction()
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [id, interaction?.status])

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  if (!interaction) return <p className="text-gray-500">Interaction not found.</p>

  const recs = interaction.recommendations || []
  const isProcessing = ['new', 'processing'].includes(interaction.status)

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Interaction header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={interaction.status} />
              <span className="text-xs text-gray-400">{interaction.interaction_type} · {interaction.source}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{interaction.title}</h2>
            <div
              onClick={() => navigate(`/customers/${interaction.customer_id}`)}
              className="flex items-center gap-1.5 mt-1 cursor-pointer hover:text-blue-600 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {interaction.customer_name} · {interaction.customer_company}
              </span>
              {interaction.health_score !== undefined && (
                <span className={`text-xs font-bold ml-2 ${
                  interaction.health_score < 40 ? 'text-red-600'
                  : interaction.health_score < 65 ? 'text-yellow-600'
                  : 'text-green-600'
                }`}>
                  {interaction.health_score} health
                </span>
              )}
            </div>
          </div>
          {interaction.status === 'awaiting_approval' && (
            <button
              onClick={handleReanalyze}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5"
            >
              <RefreshCw className="w-3 h-3" /> Re-analyze
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {interaction.content}
          </p>
        </div>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-blue-700 font-medium">AI agents are analyzing this interaction...</p>
          <p className="text-blue-500 text-sm mt-1">This page will update automatically.</p>
        </div>
      )}

      {/* Recommendations */}
      {recs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">
  {interaction.status === 'completed'
    ? `${recs.filter(r => ['approved','edited'].includes(r.decisions?.[0]?.decision)).length} Approved Action${recs.filter(r => ['approved','edited'].includes(r.decisions?.[0]?.decision)).length !== 1 ? 's' : ''}`
    : `${recs.length} Next Best Action${recs.length > 1 ? 's' : ''} — Review and Decide`
  }
</h3>

          {recs
  .filter(rec => {
    // If interaction is completed, only show approved or edited recommendations
    if (interaction.status === 'completed') {
      const decision = rec.decisions?.[0]?.decision
      return decision === 'approved' || decision === 'edited'
    }
    // If still awaiting approval, show all
    return true
  })
  .map(rec => (
    <RecommendationCard
      key={rec.id}
      rec={rec}
      onDecision={handleDecision}
      disabled={interaction.status === 'completed'}
      existingDecision={rec.decisions?.[0] || null}
    />
  ))
}

          {/* Submit all */}
          {interaction.status === 'awaiting_approval' && !submitted && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {decisions.length} of {recs.length} decision{recs.length > 1 ? 's' : ''} made
                </p>
                <button
                  onClick={handleSubmitAll}
                  disabled={submitting || decisions.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {submitting
                    ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
                    : <><CheckCircle className="w-4 h-4" /> Submit All Decisions</>
                  }
                </button>
              </div>
            </div>
          )}

          {submitted && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-700 font-medium">Decisions saved! Memory updated.</p>
              <p className="text-green-500 text-sm mt-1">Redirecting to interactions list...</p>
            </div>
          )}
        </div>
      )}

      {/* No recs + completed */}
      {recs.length === 0 && interaction.status === 'completed' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">This interaction has been completed.</p>
        </div>
      )}
    </div>
  )
}