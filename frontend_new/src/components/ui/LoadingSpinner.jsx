import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 'md', label }) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl animate-pulse" />
        <Loader2 className={`${sizes[size]} text-violet-400 animate-spin relative`} />
      </div>
      {label && <p className="text-sm text-gray-400 animate-pulse">{label}</p>}
    </div>
  )
}
