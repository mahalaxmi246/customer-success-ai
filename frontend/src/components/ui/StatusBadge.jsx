export default function StatusBadge({ status }) {
  const styles = {
    new:                'bg-blue-100 text-blue-700',
    processing:         'bg-yellow-100 text-yellow-700',
    awaiting_approval:  'bg-orange-100 text-orange-700',
    completed:          'bg-green-100 text-green-700',
  }

  const labels = {
    new:                'New',
    processing:         'Processing',
    awaiting_approval:  'Awaiting Approval',
    completed:          'Completed',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status === 'processing' && (
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5 animate-pulse" />
      )}
      {status === 'awaiting_approval' && (
        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5 animate-pulse" />
      )}
      {labels[status] || status}
    </span>
  )
}