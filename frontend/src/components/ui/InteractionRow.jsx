import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { Mail, Phone, Users, MessageSquare, Clock } from 'lucide-react'

const TYPE_ICONS = {
  'Email':          Mail,
  'Phone Call':     Phone,
  'Meeting':        Users,
  'Slack Message':  MessageSquare,
  'Support Ticket': Clock,
}

const SENTIMENT_COLORS = {
  'Positive': 'text-green-600',
  'Neutral':  'text-gray-500',
  'Negative': 'text-red-500',
}

export default function InteractionRow({ interaction }) {
  const navigate = useNavigate()
  const Icon = TYPE_ICONS[interaction.interaction_type] || Mail

  const time = interaction.timestamp
    ? new Date(interaction.timestamp).toLocaleString()
    : ''

  return (
    <tr
      onClick={() => navigate(`/interactions/${interaction.id}`)}
      className="hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
              {interaction.title || '(No title)'}
            </p>
            <p className="text-xs text-gray-500">{interaction.interaction_type}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-900">{interaction.customer_name}</p>
        <p className="text-xs text-gray-500">{interaction.customer_company}</p>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium ${SENTIMENT_COLORS[interaction.sentiment] || 'text-gray-500'}`}>
          {interaction.sentiment || '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={interaction.status} />
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{time}</td>
    </tr>
  )
}