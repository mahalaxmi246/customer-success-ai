import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCustomers, createManualInteraction } from '../utils/api'
import { Send, Loader } from 'lucide-react'

const INTERACTION_TYPES = ['Email', 'Phone Call', 'Meeting', 'Slack Message', 'Support Ticket']
const SENTIMENTS        = ['Positive', 'Neutral', 'Negative']
const INTENTS           = ['Renewal Concern', 'Feature Request', 'Complaint', 'Pricing Inquiry', 'Cancellation Risk', 'General Inquiry']

export default function AnalyzeInteraction() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]   = useState(null)
  const [cached, setCached] = useState(false)

  const [form, setForm] = useState({
    customer_id:       '',
    interaction_type:  'Email',
    title:             '',
    content:           '',
    sentiment:         'Negative',
    intent:            [],
    requested_outcome: '',
  })

  useEffect(() => {
    getCustomers().then(d => setCustomers(d.customers || []))
  }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleIntent = (intent) => {
    setForm(f => ({
      ...f,
      intent: f.intent.includes(intent)
        ? f.intent.filter(i => i !== intent)
        : [...f.intent, intent]
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
      const payload = {
        ...form,
        customer_id: parseInt(form.customer_id),
        intent: form.intent.join(', '),
      }
      const result = await createManualInteraction(payload)
if (result.cached) {
  setCached(true)
  setTimeout(() => {
    navigate(`/interactions/${result.interaction_id}`)
  }, 2000)
} else {
  navigate(`/interactions/${result.interaction_id}`)
}
    } catch (e) {
      setError(e.response?.data?.detail || 'Submission failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        {/* Customer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            value={form.customer_id}
            onChange={e => set('customer_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.company} (Health: {c.health_score})
              </option>
            ))}
          </select>
        </div>

        {/* Interaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Interaction Type</label>
          <div className="flex flex-wrap gap-2">
            {INTERACTION_TYPES.map(t => (
              <button
                key={t}
                onClick={() => set('interaction_type', t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  form.interaction_type === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Title / Subject <span className="text-gray-400">(optional)</span>
          </label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Customer unhappy with pricing"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Interaction Summary <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.content}
            onChange={e => set('content', e.target.value)}
            placeholder="Paste the email, meeting notes, call summary, or any customer interaction here..."
            rows={6}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Sentiment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Sentiment</label>
          <div className="flex gap-2">
            {SENTIMENTS.map(s => (
              <button
                key={s}
                onClick={() => set('sentiment', s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  form.sentiment === s
                    ? s === 'Positive' ? 'bg-green-600 text-white border-green-600'
                      : s === 'Negative' ? 'bg-red-600 text-white border-red-600'
                      : 'bg-gray-600 text-white border-gray-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Intent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Intent</label>
          <div className="flex flex-wrap gap-2">
            {INTENTS.map(intent => (
              <button
                key={intent}
                onClick={() => toggleIntent(intent)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  form.intent.includes(intent)
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600'
                }`}
              >
                {intent}
              </button>
            ))}
          </div>
        </div>

        {/* Requested Outcome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Requested Outcome <span className="text-gray-400">(optional)</span>
          </label>
          <input
            value={form.requested_outcome}
            onChange={e => set('requested_outcome', e.target.value)}
            placeholder="What does the customer want?"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {cached && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-700">Already analyzed</p>
              <p className="text-xs text-blue-500">This interaction was already analyzed. Redirecting to cached recommendations...</p>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
        >
          {submitting
            ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing...</>
            : <><Send className="w-4 h-4" /> Analyze Interaction</>
          }
        </button>
      </div>
    </div>
  )
}