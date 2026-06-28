export default function HeroIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 720 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="riqGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="riqGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <radialGradient id="riqGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
        <filter id="riqBlur">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      {/* Ambient glow */}
      <ellipse cx="360" cy="260" rx="280" ry="200" fill="url(#riqGlow)" />

      {/* Orbiting ring */}
      <circle cx="360" cy="260" r="195" stroke="rgba(139,92,246,0.15)" strokeWidth="1" strokeDasharray="6 10" />
      <circle cx="360" cy="260" r="155" stroke="rgba(34,211,238,0.1)" strokeWidth="1" strokeDasharray="4 8" />

      {/* Central AI hub — brain / intelligence core */}
      <circle cx="360" cy="260" r="72" fill="rgba(15,17,23,0.95)" stroke="url(#riqGrad1)" strokeWidth="2" />
      <circle cx="360" cy="260" r="58" fill="url(#riqGrad2)" opacity="0.15" />
      {/* Neural network nodes inside hub */}
      {[
        [340, 240], [380, 240], [360, 260], [335, 275], [385, 275], [360, 285],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5" fill="#a78bfa" opacity="0.9" />
        </g>
      ))}
      <path d="M340 240 L360 260 L380 240" stroke="#c4b5fd" strokeWidth="1" opacity="0.5" />
      <path d="M335 275 L360 260 L385 275" stroke="#c4b5fd" strokeWidth="1" opacity="0.5" />
      <path d="M360 260 L360 285" stroke="#67e8f9" strokeWidth="1" opacity="0.5" />
      <text x="360" y="268" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">AI</text>

      {/* ── Left: Incoming interactions (emails, calls) ── */}
      <g opacity="0.95">
        {/* Email 1 */}
        <rect x="40" y="120" width="56" height="40" rx="10" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)" strokeWidth="1.2" />
        <path d="M40 130 L68 148 L96 130" stroke="#60a5fa" strokeWidth="1.5" fill="none" />
        <text x="68" y="158" textAnchor="middle" fill="#93c5fd" fontSize="8" fontFamily="Inter,sans-serif">Email</text>
        <path d="M96 140 C180 140 220 200 288 240" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.6" />

        {/* Phone call */}
        <rect x="30" y="220" width="56" height="40" rx="10" fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.4)" strokeWidth="1.2" />
        <path d="M52 232 C52 232 48 238 48 244 C48 250 54 254 58 250 C62 246 66 252 62 256 C58 260 50 262 46 256 C42 250 44 234 52 232Z" fill="#c084fc" opacity="0.8" />
        <text x="58" y="258" textAnchor="middle" fill="#d8b4fe" fontSize="8" fontFamily="Inter,sans-serif">Call</text>
        <path d="M86 240 C160 250 240 255 288 260" stroke="#c084fc" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.6" />

        {/* Meeting */}
        <rect x="50" y="320" width="56" height="40" rx="10" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.2" />
        <circle cx="68" cy="336" r="6" fill="#34d399" opacity="0.7" />
        <circle cx="82" cy="336" r="6" fill="#34d399" opacity="0.5" />
        <rect x="62" y="348" width="28" height="4" rx="2" fill="#6ee7b7" opacity="0.6" />
        <text x="78" y="358" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="Inter,sans-serif">Meeting</text>
        <path d="M106 340 C180 320 240 290 288 275" stroke="#34d399" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.6" />
      </g>

      {/* ── Right: Outputs — health scores & actions ── */}
      <g>
        {/* Customer health ring — at risk → healthy */}
        <g transform="translate(520, 100)">
          <circle cx="50" cy="50" r="42" fill="rgba(15,17,23,0.9)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(244,63,94,0.3)" strokeWidth="6" strokeDasharray="264" strokeDashoffset="80" transform="rotate(-90 50 50)" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#riqGrad1)" strokeWidth="6" strokeDasharray="264" strokeDashoffset="180" transform="rotate(-90 50 50)" strokeLinecap="round" />
          <text x="50" y="48" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="Inter,sans-serif">78</text>
          <text x="50" y="62" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="Inter,sans-serif">HEALTH</text>
          <path d="M288 220 C380 180 460 150 520 150" stroke="url(#riqGrad1)" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.5" />
        </g>

        {/* Next Best Action card */}
        <g transform="translate(500, 210)">
          <rect width="160" height="90" rx="12" fill="rgba(15,17,23,0.95)" stroke="rgba(139,92,246,0.35)" strokeWidth="1.2" />
          <rect x="12" y="12" width="60" height="8" rx="4" fill="rgba(139,92,246,0.4)" />
          <rect x="12" y="28" width="130" height="6" rx="3" fill="rgba(255,255,255,0.15)" />
          <rect x="12" y="40" width="100" height="6" rx="3" fill="rgba(255,255,255,0.08)" />
          <rect x="12" y="58" width="70" height="20" rx="8" fill="url(#riqGrad2)" opacity="0.5" />
          <text x="47" y="72" textAnchor="middle" fill="white" fontSize="8" fontWeight="600" fontFamily="Inter,sans-serif">Approve ✓</text>
          <text x="130" y="22" textAnchor="end" fill="#a78bfa" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif">94%</text>
          <path d="M432 260 C480 250 500 240 500 255" stroke="#a78bfa" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.5" />
        </g>

        {/* Retention trend arrow up */}
        <g transform="translate(530, 340)">
          <rect width="120" height="70" rx="12" fill="rgba(15,17,23,0.9)" stroke="rgba(16,185,129,0.3)" strokeWidth="1.2" />
          <polyline points="20,50 40,35 60,42 80,20 100,28" stroke="#34d399" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="100" cy="28" r="4" fill="#34d399" />
          <text x="60" y="62" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontFamily="Inter,sans-serif">Retention ↑ 23%</text>
          <path d="M432 290 C480 310 510 340 530 375" stroke="#34d399" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.5" />
        </g>
      </g>

      {/* Floating sentiment badges */}
      <g>
        <rect x="280" y="60" width="72" height="24" rx="12" fill="rgba(244,63,94,0.15)" stroke="rgba(244,63,94,0.35)" />
        <text x="316" y="76" textAnchor="middle" fill="#fb7185" fontSize="9" fontWeight="600" fontFamily="Inter,sans-serif">Negative</text>

        <rect x="310" y="430" width="100" height="24" rx="12" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.35)" />
        <text x="360" y="446" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="600" fontFamily="Inter,sans-serif">Action Ready ✦</text>
      </g>

      {/* Churn shield icon top-right */}
      <g transform="translate(600, 40)" opacity="0.8">
        <path d="M30 8 L50 16 L50 32 C50 44 30 52 30 52 C30 52 10 44 10 32 L10 16 Z" fill="rgba(139,92,246,0.2)" stroke="url(#riqGrad1)" strokeWidth="1.5" />
        <path d="M22 30 L28 36 L40 24" stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>

      {/* Sparkle accents */}
      {[[200, 80], [480, 420], [120, 400], [620, 280]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill="#c4b5fd" opacity={0.4 + i * 0.15} />
        </g>
      ))}
    </svg>
  )
}
