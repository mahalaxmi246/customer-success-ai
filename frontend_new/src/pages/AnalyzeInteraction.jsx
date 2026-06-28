import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCustomers, createManualInteraction } from '../utils/api'
import GlassCard from '../components/ui/GlassCard'
import PageHeader from '../components/ui/PageHeader'
import { Loader, Sparkles, ChevronRight, ChevronLeft, Check, ChevronDown } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const INTERACTION_TYPES = ['Email', 'Phone Call', 'Meeting', 'Slack Message', 'Support Ticket']
const SENTIMENTS = ['Positive', 'Neutral', 'Negative']
const INTENTS = ['Renewal Concern', 'Feature Request', 'Complaint', 'Pricing Inquiry', 'Cancellation Risk', 'General Inquiry']
const STEPS = ['Customer', 'Details', 'Analysis']

function CustomerDropdown({ customers, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const selected = customers.find(c => c.id === parseInt(value))

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const healthColor = (score) =>
    score < 40 ? 'text-rose-400' : score < 65 ? 'text-amber-400' : 'text-emerald-400'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-field w-full flex items-center justify-between text-left"
      >
        {selected ? (
          <span className={isDark ? 'text-white' : 'text-gray-900'}>
            {selected.name}
            <span className={`ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>— {selected.company}</span>
            <span className={`ml-2 text-xs font-bold ${healthColor(selected.health_score)}`}>
              ♥ {selected.health_score}
            </span>
          </span>
        ) : (
          <span className="text-gray-400">Choose a customer...</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute z-50 w-full mt-1 rounded-xl border shadow-2xl overflow-hidden ${
          isDark
            ? 'border-white/[0.12] bg-[#161922]'
            : 'border-violet-200 bg-white shadow-violet-100'
        }`}>
          <div className="max-h-60 overflow-y-auto scrollbar-thin">
            {customers.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(String(c.id)); setOpen(false) }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left ${
                  value === String(c.id)
                    ? isDark
                      ? 'bg-violet-500/10 border-l-2 border-violet-500'
                      : 'bg-violet-50 border-l-2 border-violet-500'
                    : isDark
                      ? 'hover:bg-white/[0.06]'
                      : 'hover:bg-violet-50'
                }`}
              >
                <div>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.name}</span>
                  <span className={`ml-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{c.company}</span>
                </div>
                <span className={`text-xs font-bold tabular-nums ${healthColor(c.health_score)}`}>
                  ♥ {c.health_score}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnalyzeInteraction() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(0)
  const [cached, setCached] = useState(false)

  const [form, setForm] = useState({
    customer_id: '',
    interaction_type: 'Email',
    title: '',
    content: '',
    sentiment: 'Negative',
    intent: [],
    requested_outcome: '',
  })

  useEffect(() => {
    getCustomers().then(d => setCustomers(d.customers || [])).catch(() => {})
  }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleIntent = (intent) => {
    setForm(f => ({
      ...f,
      intent: f.intent.includes(intent) ? f.intent.filter(i => i !== intent) : [...f.intent, intent],
    }))
  }

  const handleSubmit = async () => {
    if (!form.customer_id || !form.content.trim()) {
      setError('Please select a customer and enter the interaction content.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const result = await createManualInteraction({
        ...form,
        customer_id: parseInt(form.customer_id),
        intent: form.intent.join(', '),
      })
      if (result.cached) {
        setCached(true)
        setTimeout(() => navigate(`/interactions/${result.interaction_id}`), 2000)
      } else {
        navigate(`/interactions/${result.interaction_id}`)
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Submission failed. Please try again.')
      setSubmitting(false)
    }
  }

  const selectedCustomer = customers.find(c => c.id === parseInt(form.customer_id))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Analyze Interaction"
        subtitle="Submit customer interactions for multi-agent AI analysis"
        badge="Multi-Agent Pipeline"
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-violet-400' : 'text-gray-600'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                i < step ? 'bg-violet-500 border-violet-500 text-white' :
                i === step ? 'border-violet-500 text-violet-400 bg-violet-500/10' :
                'border-gray-600 text-gray-600'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? 'bg-violet-500/50' : 'bg-white/[0.08]'}`} />
            )}
          </div>
        ))}
      </div>

      <GlassCard className="p-6 space-y-6">

        {/* Step 0: Customer */}
        {step === 0 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Customer <span className="text-rose-400">*</span>
              </label>
              <CustomerDropdown
                customers={customers}
                value={form.customer_id}
                onChange={val => set('customer_id', val)}
              />
            </div>

            {selectedCustomer && (
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <p className="text-sm font-medium text-white">{selectedCustomer.name}</p>
                <p className="text-xs text-gray-400">{selectedCustomer.company} · Health: {selectedCustomer.health_score}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Interaction Type</label>
              <div className="flex flex-wrap gap-2">
                {INTERACTION_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => set('interaction_type', t)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      form.interaction_type === t
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                        : 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title / Subject <span className="text-gray-500">(optional)</span>
              </label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Customer unhappy with pricing"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Interaction Summary <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={e => set('content', e.target.value)}
                placeholder="Paste the email, meeting notes, call summary, or any customer interaction here..."
                rows={8}
                className="input-field resize-none"
              />
              <p className="text-xs text-gray-500 mt-1.5">{form.content.length} characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Requested Outcome <span className="text-gray-500">(optional)</span>
              </label>
              <input
                value={form.requested_outcome}
                onChange={e => set('requested_outcome', e.target.value)}
                placeholder="What does the customer want?"
                className="input-field"
              />
            </div>
          </div>
        )}

        {/* Step 2: Analysis tags */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Customer Sentiment</label>
              <div className="flex gap-2">
                {SENTIMENTS.map(s => (
                  <button
                    key={s}
                    onClick={() => set('sentiment', s)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      form.sentiment === s
                        ? s === 'Positive' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : s === 'Negative' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-gray-500/20 text-gray-300 border-gray-500/40'
                        : 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Customer Intent</label>
              <div className="flex flex-wrap gap-2">
                {INTENTS.map(intent => (
                  <button
                    key={intent}
                    onClick={() => toggleIntent(intent)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      form.intent.includes(intent)
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    {intent}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Ready to analyze</p>
              <p className="text-sm text-gray-300">
                <span className="text-white font-medium">{selectedCustomer?.name || 'Customer'}</span>
                {' · '}{form.interaction_type}
                {' · '}{form.sentiment} sentiment
              </p>
              {form.content && (
                <p className="text-xs text-gray-500 line-clamp-2">{form.content}</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}

        {cached && (
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse shrink-0" />
            <div>
              <p className="text-sm font-medium text-violet-300">Already analyzed</p>
              <p className="text-xs text-violet-400/70">Redirecting to cached recommendations...</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => {
                if (step === 0 && !form.customer_id) { setError('Please select a customer.'); return }
                if (step === 1 && !form.content.trim()) { setError('Please enter interaction content.'); return }
                setError(null)
                setStep(s => s + 1)
              }}
              className="btn-primary"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting
                ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing...</>
                : <><Sparkles className="w-4 h-4" /> Run AI Analysis</>
              }
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  )
}