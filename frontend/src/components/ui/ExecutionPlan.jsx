import { useState } from 'react'
import { Mail, Users, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

export default function ExecutionPlan({ type, content }) {
  const [open, setOpen]     = useState(true)
  const [copied, setCopied] = useState(false)

  if (!content || type === 'none') return null

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {type === 'email'
            ? <Mail className="w-4 h-4 text-blue-600" />
            : <Users className="w-4 h-4 text-purple-600" />
          }
          <span className="text-sm font-medium text-gray-700">
            {type === 'email' ? 'Email Draft' : 'Meeting Brief'}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="p-4 bg-white">
          {type === 'email' && content && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Subject</p>
                <p className="text-sm font-medium text-gray-900">{content.subject}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">Body</p>
                  <button
                    onClick={() => copyText(content.body)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 rounded p-3 leading-relaxed">
                  {content.body}
                </pre>
              </div>
            </div>
          )}

          {type === 'meeting' && content && (
            <div className="space-y-4">
              {content.meeting_title && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Meeting Title</p>
                  <p className="text-sm font-semibold text-gray-900">{content.meeting_title}</p>
                </div>
              )}
              {content.objectives?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Objectives</p>
                  <ul className="space-y-1">
                    {content.objectives.map((o, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {content.discussion_points?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Discussion Points</p>
                  <ul className="space-y-1">
                    {content.discussion_points.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1 w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {content.suggested_questions?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Suggested Questions</p>
                  <ul className="space-y-1">
                    {content.suggested_questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-500 font-bold flex-shrink-0">Q{i+1}.</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {content.important_context && (
  <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-2">
    <p className="text-xs font-medium text-amber-700 uppercase mb-1">Important Context</p>
    <p className="text-sm text-amber-800">{content.important_context}</p>
  </div>
)}
              {content.desired_outcome && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-xs font-medium text-green-700 uppercase mb-1">Desired Outcome</p>
                  <p className="text-sm text-green-800">{content.desired_outcome}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}