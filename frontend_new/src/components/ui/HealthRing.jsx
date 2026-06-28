export default function HealthRing({ score, size = 64, strokeWidth = 5 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score < 40 ? '#f43f5e' :
    score < 65 ? '#f59e0b' :
    '#10b981'

  const glowColor =
    score < 40 ? 'rgba(244, 63, 94, 0.4)' :
    score < 65 ? 'rgba(245, 158, 11, 0.4)' :
    'rgba(16, 185, 129, 0.4)'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full blur-md opacity-50"
        style={{ background: glowColor }}
      />
      <svg width={size} height={size} className="-rotate-90 relative">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ring-track, rgba(255,255,255,0.08))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span
        className="absolute text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  )
}