import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCustomerHistory } from '../utils/api'
import StatusBadge from '../components/ui/StatusBadge'
import { ArrowLeft, TrendingDown, TrendingUp, Calendar, Brain } from 'lucide-react'

export default function CustomerHistory() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCustomerHistory(id).then(setData).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  if (!data) return <p className="text-gray-500">Customer not found.</p>

  const { customer, interactions, memory } = data
  const histCtx = memory?.historical_context || {}

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Customer header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
            <p className="text-gray-500">{customer.company}</p>
            <p className="text-sm text-gray-400 mt-1">{customer.email}</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${
              customer.health_score < 40 ? 'text-red-600'
              : customer.health_score < 65 ? 'text-yellow-600'
              : 'text-green-600'
            }`}>
              {customer.health_score}
            </div>
            <p className="text-xs text-gray-400">health score</p>
            {customer.renewal_date && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                <Calendar className="w-3 h-3" />
                Renews {new Date(customer.renewal_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Memory */}
      {memory && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-900">AI Memory Summary</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">{memory.summary}</p>

          {histCtx.key_issues?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Key Issues</p>
              <ul className="space-y-1">
                {histCtx.key_issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1 w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {histCtx.renewal_risk && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              histCtx.renewal_risk?.includes('HIGH')
                ? 'bg-red-100 text-red-700'
                : histCtx.renewal_risk?.includes('MEDIUM')
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }`}>
              Renewal Risk: {histCtx.renewal_risk}
            </div>
          )}
        </div>
      )}

      {/* Interaction timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Interaction History ({interactions.length})
        </h3>
        <div className="space-y-3">
          {interactions.map(i => (
            <div
              key={i.id}
              onClick={() => navigate(`/interactions/${i.id}`)}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{i.title}</p>
                <p className="text-xs text-gray-500">
                  {i.interaction_type} · {new Date(i.timestamp).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={i.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}