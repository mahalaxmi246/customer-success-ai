export default function GlassCard({ children, className = '', hover = false, onClick, style }) {
  const base = hover ? 'glass-card-hover cursor-pointer' : 'glass-card'
  return (
    <div className={`${base} ${className}`} onClick={onClick} style={style}>
      {children}
    </div>
  )
}
