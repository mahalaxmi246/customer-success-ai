const ICON_STYLES = {
  blue:    { bg: 'bg-blue-500/15',    text: 'text-blue-400',    glow: 'stat-glow-blue'    },
  violet:  { bg: 'bg-violet-500/15',  text: 'text-violet-400',  glow: 'stat-glow-violet'  },
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-400',   glow: 'stat-glow-amber'   },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', glow: 'stat-glow-emerald' },
  rose:    { bg: 'bg-rose-500/15',    text: 'text-rose-400',    glow: 'stat-glow-rose'    },
  cyan:    { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    glow: 'stat-glow-blue'    },
}

export default function StatCard({ label, value, icon: Icon, color = 'violet', trend, delay = 0 }) {
  const styles = ICON_STYLES[color] || ICON_STYLES.violet

  return (
    <div
      className={`glass-card p-5 ${styles.glow} animate-slide-up`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-white mt-2 tabular-nums">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${styles.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${styles.text}`} />
        </div>
      </div>
    </div>
  )
}
