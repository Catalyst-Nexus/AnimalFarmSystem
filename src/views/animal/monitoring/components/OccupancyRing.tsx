interface OccupancyRingProps {
  percent: number
  size?: number
  strokeWidth?: number
}

export const OccupancyRing = ({ percent, size = 56, strokeWidth = 5 }: OccupancyRingProps) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference
  const color = percent >= 100 ? '#ef4444' : percent >= 80 ? '#f97316' : '#22c55e'
  const trackColor = percent >= 100 ? '#fecaca' : percent >= 80 ? '#fed7aa' : '#bbf7d0'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
        {Math.round(percent)}%
      </span>
    </div>
  )
}
