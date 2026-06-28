export default function MiniBarChart({ data, height = 80 }) {
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((item, i) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-violet-600/80 to-violet-400/60 transition-all duration-700 ease-out animate-slide-up"
            style={{
              height: `${(item.value / max) * 100}%`,
              minHeight: item.value > 0 ? 4 : 0,
              animationDelay: `${i * 80}ms`,
              animationFillMode: 'both',
            }}
          />
          <span className="text-[10px] text-gray-500 font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
