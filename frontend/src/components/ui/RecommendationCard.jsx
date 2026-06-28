import { useState } from 'react'
import {
  ArrowUpCircle, Mail, Calendar, AlertTriangle,
  BookOpen, CheckCircle, XCircle, Edit3, ChevronDown, ChevronUp
} from 'lucide-react'
import ExecutionPlan from './ExecutionPlan'
import {  useEffect } from 'react'

const ACTION_CONFIG = {
  reply_email:      { label: 'Reply Email',      icon: Mail,          color: 'blue'   },
  schedule_meeting: { label: 'Schedule Meeting', icon: Calendar,      color: 'purple' },
  escalate:         { label: 'Escalate',         icon: AlertTriangle, color: 'red'    },
  send_resources:   { label: 'Send Resources',   icon: BookOpen,      color: 'green'  },
}

const COLOR_STYLES = {
  blue:   { badge: 'bg-blue-100 text-blue-700',   icon: 'bg-blue-50 text-blue-600',   bar: 'bg-blue-500'   },
  purple: { badge: 'bg-purple-100 text-purple-700', icon: 'bg-purple-50 text-purple-600', bar: 'bg-purple-500' },
  red:    { badge: 'bg-red-100 text-red-700',     icon: 'bg-red-50 text-red-600',     bar: 'bg-red-500'    },
  green:  { badge: 'bg-green-100 text-green-700', icon: 'bg-green-50 text-green-600', bar: 'bg-green-500'  },
}

export default function RecommendationCard({ rec, onDecision, disabled, existingDecision = null }) {
  const [decision, setDecision]     = useState(null)
  const [editContent, setEdit]      = useState('')
  const [reason, setReason]         = useState('')
  const [showEvidence, setShowEvid] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  // Sync with existing decision from API on load and refresh
  useEffect(() => {
    if (existingDecision) {
      setDecision(existingDecision.decision)
      setEdit(existingDecision.edited_content || '')
      setReason(existingDecision.reason || '')
      setSubmitted(true)
    }
  }, [existingDecision?.id])

  const config = ACTION_CONFIG[rec.action_type] || ACTION_CONFIG.reply_email
  const colors = COLOR_STYLES[config.color]
  const Icon   = config.icon

  const confidence     = Math.round(rec.confidence)
  const evidenceList   = Array.isArray(rec.evidence) ? rec.evidence : []

  const handleSubmit = () => {
    if (!decision) return
    onDecision({
      recommendation_id: rec.id,
      decision,
      edited_content: decision === 'edited' ? editContent : null,
      reason: reason || null,
    })
    setSubmitted(true)
  }

  
  if (submitted) {
  return (
    <div className="border border-green-200 rounded-xl overflow-hidden bg-white">
      {/* Decision banner */}
      <div className={`px-5 py-2.5 flex items-center gap-2 ${
        decision === 'approved' ? 'bg-green-50 border-b border-green-200'
        : decision === 'edited' ? 'bg-yellow-50 border-b border-yellow-200'
        : 'bg-red-50 border-b border-red-200'
      }`}>
        <CheckCircle className={`w-4 h-4 ${
          decision === 'approved' ? 'text-green-600'
          : decision === 'edited' ? 'text-yellow-600'
          : 'text-red-500'
        }`} />
        <span className={`text-sm font-medium ${
          decision === 'approved' ? 'text-green-700'
          : decision === 'edited' ? 'text-yellow-700'
          : 'text-red-600'
        }`}>
          {decision === 'approved' ? '✓ Approved'
          : decision === 'edited' ? '✎ Edited'
          : '✗ Rejected'}
        </span>
      </div>

      {/* Full recommendation content */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors.icon}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">RANK {rec.rank}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                {config.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {rec.action_title || config.label}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-gray-900">{confidence}%</p>
            <p className="text-xs text-gray-400">confidence</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-3">{rec.reasoning}</p>

        {editContent && decision === 'edited' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <p className="text-xs font-medium text-yellow-700 uppercase mb-1">Edited Content</p>
            <p className="text-sm text-yellow-800">{editContent}</p>
          </div>
        )}

        <ExecutionPlan
          type={rec.execution_plan_type}
          content={rec.execution_plan_content}
        />
      </div>
    </div>
  )
}

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors.icon}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400">RANK {rec.rank}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {rec.action_title || config.label}
              </p>
            </div>
          </div>

          {/* Confidence */}
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-gray-900">{confidence}%</p>
            <p className="text-xs text-gray-400">confidence</p>
            <div className="mt-1 w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${colors.bar}`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Reasoning */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Reasoning</p>
          <p className="text-sm text-gray-700 leading-relaxed">{rec.reasoning}</p>
        </div>

        {/* Evidence toggle */}
        {evidenceList.length > 0 && (
          <div>
            <button
              onClick={() => setShowEvid(!showEvidence)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              {showEvidence ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showEvidence ? 'Hide' : 'Show'} evidence ({evidenceList.length})
            </button>
            {showEvidence && (
              <ul className="mt-2 space-y-1">
                {evidenceList.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="mt-1 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Execution plan */}
        <ExecutionPlan
          type={rec.execution_plan_type}
          content={rec.execution_plan_content}
        />

        {/* Decision section */}
        {!disabled && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase">Your Decision</p>

            <div className="flex gap-2">
              {['approved', 'edited', 'rejected'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDecision(d)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    decision === d
                      ? d === 'approved' ? 'bg-green-600 text-white border-green-600'
                        : d === 'rejected' ? 'bg-red-600 text-white border-red-600'
                        : 'bg-yellow-500 text-white border-yellow-500'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {d === 'approved' ? '✓ Approve'
                    : d === 'edited' ? '✎ Edit'
                    : '✗ Reject'}
                </button>
              ))}
            </div>

            {decision === 'edited' && (
              <textarea
                value={editContent}
                onChange={e => setEdit(e.target.value)}
                placeholder="Describe your edit or paste modified content..."
                className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            )}

            {decision === 'rejected' && (
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason for rejection (optional)..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            )}

            {decision && (
              <button
                onClick={handleSubmit}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Submit Decision
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}