import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { Mail, Phone, Users, MessageSquare, Clock, ChevronRight } from 'lucide-react'

const TYPE_ICONS = {
  'Email':          Mail,
  'Phone Call':     Phone,
  'Meeting':        Users,
  'Slack Message':  MessageSquare,
  'Support Ticket': Clock,
}

const SENTIMENT_STYLES = {
  'Positive': 'text-emerald-400 bg-emerald-500/10',
  'Neutral':  'text-gray-400 bg-gray-500/10',
  'Negative': 'text-rose-400 bg-rose-500/10',
}

export default function InteractionRow({ interaction }) {
  const navigate = useNavigate()
  const Icon = TYPE_ICONS[interaction.interaction_type] || Mail
  const sentimentStyle = SENTIMENT_STYLES[interaction.sentiment] || SENTIMENT_STYLES['Neutral']

  const time = interaction.timestamp
    ? new Date(interaction.timestamp).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : ''

  return (
    <tr
      onClick={() => navigate(`/interactions/${interaction.id}`)}
      className="group hover:bg-white/[0.03] cursor-pointer transition-all duration-200 border-b border-white/[0.04] last:border-0"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
            <Icon className="w-4 h-4 text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate max-w-xs group-hover:text-violet-200 transition-colors">
              {interaction.title || '(No title)'}
            </p>
            <p className="text-xs text-gray-500">{interaction.interaction_type}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-medium text-gray-200">{interaction.customer_name}</p>
        <p className="text-xs text-gray-500">{interaction.customer_company}</p>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${sentimentStyle}`}>
          {interaction.sentiment || '—'}
        </span>
      </td>
      <td className="px-5 py-4">
        <StatusBadge status={interaction.status} />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500 font-mono">{time}</span>
          <ChevronRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </td>
    </tr>
  )
}
