import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCustomers, getInteractions } from '../utils/api'
import StatusBadge from '../components/ui/StatusBadge'
import { Users, Mail, Clock, CheckCircle, AlertTriangle, TrendingDown } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [customers, setCustomers]         = useState([])
  const [interactions, setInteractions]   = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    Promise.all([getCustomers(), getInteractions()])
      .then(([c, i]) => {
        setCustomers(c.customers || [])
        setInteractions(i.interactions || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total:            interactions.length,
    pending:          interactions.filter(i => i.status === 'awaiting_approval').length,
    processing:       interactions.filter(i => i.status === 'processing').length,
    completed:        interactions.filter(i => i.status === 'completed').length,
  }

  const criticalCustomers = customers.filter(c => c.health_score < 50)
  const recentInteractions = interactions.slice(0, 6)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Interactions', value: stats.total,      icon: Mail,         color: 'blue'   },
          { label: 'Awaiting Approval',  value: stats.pending,    icon: Clock,        color: 'orange' },
          { label: 'Processing',         value: stats.processing, icon: AlertTriangle, color: 'yellow' },
          { label: 'Completed',          value: stats.completed,  icon: CheckCircle,  color: 'green'  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${color}-50`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* At-risk customers */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-gray-900">At-Risk Customers</h2>
            <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              {criticalCustomers.length}
            </span>
          </div>
          <div className="space-y-3">
            {customers.slice(0, 6).map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.company}</p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${
                    c.health_score < 40 ? 'text-red-600'
                    : c.health_score < 65 ? 'text-yellow-600'
                    : 'text-green-600'
                  }`}>
                    {c.health_score}
                  </span>
                  <p className="text-xs text-gray-400">health</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent interactions */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Interactions</h2>
            <button
              onClick={() => navigate('/emails')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {recentInteractions.map(i => (
              <div
                key={i.id}
                onClick={() => navigate(`/interactions/${i.id}`)}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{i.title}</p>
                  <p className="text-xs text-gray-500">{i.customer_name} · {i.customer_company}</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <StatusBadge status={i.status} />
                </div>
              </div>
            ))}
            {recentInteractions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No interactions yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}