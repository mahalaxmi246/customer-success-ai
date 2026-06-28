import { useState, useEffect } from 'react'
import {
  Mail, Calendar, AlertTriangle, BookOpen,
  CheckCircle, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react'
import ExecutionPlan from './ExecutionPlan'
import GlassCard from './GlassCard'

const ACTION_CONFIG = {
  reply_email:      { label: 'Reply Email',      icon: Mail,          color: 'blue'   },
  schedule_meeting: { label: 'Schedule Meeting', icon: Calendar,      color: 'purple' },
  escalate:         { label: 'Escalate',         icon: AlertTriangle, color: 'red'    },
  send_resources:   { label: 'Send Resources',   icon: BookOpen,      color: 'green'  },
}

const COLOR_STYLES = {
  blue:   { badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',   icon: 'bg-blue-500/15 text-blue-400',   bar: 'from-blue-500 to-blue-400'   },
  purple: { badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30', icon: 'bg-purple-500/15 text-purple-400', bar: 'from-purple-500 to-purple-400' },
  red:    { badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',     icon: 'bg-rose-500/15 text-rose-400',     bar: 'from-rose-500 to-rose-400'    },
  green:  { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: 'bg-emerald-500/15 text-emerald-400', bar: 'from-emerald-500 to-emerald-400' },
}

export default function RecommendationCard({ rec, onDecision, disabled, existingDecision = null }) {
  const [decision, setDecision]     = useState(null)
  const [editContent, setEdit]      = useState('')
  const [reason, setReason]         = useState('')
  const [showEvidence, setShowEvid] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  // Sync with existing decision from API on load and refresh (from functional)
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
  const confidence = Math.round(rec.confidence)
  const evidenceList = Array.isArray(rec.evidence) ? rec.evidence : []

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

  // Submitted state — show full card with decision banner (from functional)
  if (submitted) {
    return (
      <GlassCard className="overflow-hidden animate-slide-up">
        {/* Decision banner */}
        <div className={`px-6 py-3 flex items-center gap-2 border-b ${
          decision === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20'
          : decision === 'edited' ? 'bg-amber-500/10 border-amber-500/20'
          : 'bg-rose-500/10 border-rose-500/20'
        }`}>
          <CheckCircle className={`w-4 h-4 ${
            decision === 'approved' ? 'text-emerald-400'
            : decision === 'edited' ? 'text-amber-400'
            : 'text-rose-400'
          }`} />
          <span className={`text-sm font-medium ${
            decision === 'approved' ? 'text-emerald-300'
            : decision === 'edited' ? 'text-amber-300'
            : 'text-rose-300'
          }`}>
            {decision === 'approved' ? '✓ Approved'
            : decision === 'edited' ? '✎ Edited'
            : '✗ Rejected'}
          </span>
        </div>

        {/* Full content */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.icon}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-gray-500 tracking-widest">RANK {rec.rank}</span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${colors.badge}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-base font-semibold text-white mt-1">{rec.action_title || config.label}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-white tabular-nums">{confidence}</p>
                <span className="text-sm text-gray-500">%</span>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">confidence</p>
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed">{rec.reasoning}</p>

          {editContent && decision === 'edited' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-1.5">Edited Content</p>
              <p className="text-sm text-amber-200/80">{editContent}</p>
            </div>
          )}

          <ExecutionPlan type={rec.execution_plan_type} content={rec.execution_plan_content} />
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.icon}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-gray-500 tracking-widest">RANK {rec.rank}</span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${colors.badge}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-base font-semibold text-white mt-1">
                {rec.action_title || config.label}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold text-white tabular-nums">{confidence}</p>
              <span className="text-sm text-gray-500">%</span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">confidence</p>
            <div className="mt-2 w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-violet-400" /> AI Reasoning
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">{rec.reasoning}</p>
        </div>

        {evidenceList.length > 0 && (
          <div>
            <button
              onClick={() => setShowEvid(!showEvidence)}
              className="flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              {showEvidence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showEvidence ? 'Hide' : 'Show'} evidence ({evidenceList.length})
            </button>
            {showEvidence && (
              <ul className="mt-3 space-y-2">
                {evidenceList.map((e, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-gray-400 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]">
                    <span className="mt-1 w-1.5 h-1.5 bg-violet-400 rounded-full shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <ExecutionPlan type={rec.execution_plan_type} content={rec.execution_plan_content} />

        {!disabled && (
          <div className="pt-4 border-t border-white/[0.06] space-y-4">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Your Decision</p>

            <div className="grid grid-cols-3 gap-2">
              {['approved', 'edited', 'rejected'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDecision(d)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                    decision === d
                      ? d === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                        : d === 'rejected' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/10'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                      : 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {d === 'approved' ? '✓ Approve' : d === 'edited' ? '✎ Edit' : '✗ Reject'}
                </button>
              ))}
            </div>

            {decision === 'edited' && (
              <textarea
                value={editContent}
                onChange={e => setEdit(e.target.value)}
                placeholder="Describe your edit or paste modified content..."
                className="input-field resize-none"
                rows={3}
              />
            )}

            {decision === 'rejected' && (
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason for rejection (optional)..."
                className="input-field"
              />
            )}

            {decision && (
              <button onClick={handleSubmit} className="btn-primary w-full">
                Submit Decision
              </button>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  )
}
