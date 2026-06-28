import { useState } from 'react'
import { Mail, Users, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ExecutionPlan({ type, content }) {
  const [open, setOpen]     = useState(true)
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (!content || type === 'none') return null

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`border rounded-xl overflow-hidden ${isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-violet-100 bg-white/60'}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-violet-50'}`}
      >
        <div className="flex items-center gap-2.5">
          {type === 'email'
            ? <Mail className="w-4 h-4 text-blue-400" />
            : <Users className="w-4 h-4 text-purple-400" />
          }
          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            {type === 'email' ? 'Email Draft' : 'Meeting Brief'}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {open && (
        <div className={`p-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-violet-100'}`}>
          {type === 'email' && content && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Subject</p>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{content.subject}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Body</p>
                  <button
                    onClick={() => copyText(content.body)}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className={`text-sm whitespace-pre-wrap font-sans rounded-xl p-4 leading-relaxed border ${
                  isDark
                    ? 'text-gray-300 bg-white/[0.03] border-white/[0.06]'
                    : 'text-gray-700 bg-violet-50/60 border-violet-100'
                }`}>
                  {content.body}
                </pre>
              </div>
            </div>
          )}

          {type === 'meeting' && content && (
            <div className="space-y-4">
              {content.meeting_title && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Meeting Title</p>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{content.meeting_title}</p>
                </div>
              )}
              {content.objectives?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Objectives</p>
                  <ul className="space-y-1.5">
                    {content.objectives.map((o, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {content.discussion_points?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Discussion Points</p>
                  <ul className="space-y-1.5">
                    {content.discussion_points.map((d, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="mt-1.5 w-1.5 h-1.5 bg-purple-400 rounded-full shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {content.suggested_questions?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Suggested Questions</p>
                  <ul className="space-y-1.5">
                    {content.suggested_questions.map((q, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="text-violet-400 font-bold font-mono text-xs shrink-0">Q{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {content.important_context && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mb-1.5">Important Context</p>
                  <p className={`text-sm ${isDark ? 'text-amber-200/80' : 'text-amber-800'}`}>{content.important_context}</p>
                </div>
              )}
              {content.desired_outcome && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-1.5">Desired Outcome</p>
                  <p className={`text-sm ${isDark ? 'text-emerald-200/80' : 'text-emerald-800'}`}>{content.desired_outcome}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}