import { useState } from "react"

interface BarDatum { label: string; value: number; color?: string }
interface Props { data: BarDatum[]; height?: number; formatValue?: (v: number) => string }

export function MiniBarChart({ data, height = 180, formatValue = (v) => String(v) }: Props) {
  const [tip, setTip] = useState<{ x: number; y: number; d: BarDatum } | null>(null)
  if (!data.length) return <div className="text-slate-400 text-sm text-center py-8">No data</div>

  const max = Math.max(...data.map((d) => d.value), 1)
  const W = 480
  const padL = 8; const padR = 8; const padT = 12; const padB = 36
  const chartH = height - padT - padB
  const barW = Math.max(8, (W - padL - padR) / data.length - 6)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = padT + chartH - f * chartH
          return (
            <line key={f} x1={padL} x2={W - padR} y1={y} y2={y}
              stroke="#e2e8f0" strokeWidth={f === 0 ? 1.5 : 0.75} strokeDasharray={f === 0 ? undefined : "3 3"} />
          )
        })}
        {data.map((d, i) => {
          const slotW = (W - padL - padR) / data.length
          const cx = padL + slotW * i + slotW / 2
          const barH = Math.max(2, (d.value / max) * chartH)
          const y = padT + chartH - barH
          const color = d.color ?? "#6366f1"
          return (
            <g key={i}
              onMouseEnter={(e) => setTip({ x: cx, y, d })}
              onMouseLeave={() => setTip(null)}
              className="cursor-pointer"
            >
              <rect x={cx - barW / 2} y={y} width={barW} height={barH}
                rx={3} fill={color} fillOpacity={0.85}
                className="transition-all duration-150 hover:fill-opacity-100" />
              <text x={cx} y={padT + chartH + 16} textAnchor="middle"
                fontSize={10} fill="#94a3b8"
                style={{ fontFamily: "inherit" }}
              >
                {d.label.length > 7 ? d.label.slice(0, 6) + "…" : d.label}
              </text>
            </g>
          )
        })}
      </svg>
      {tip && (
        <div className="pointer-events-none absolute z-20 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl"
          style={{ left: `${(tip.x / 480) * 100}%`, top: `${tip.y - 10}px`, transform: "translate(-50%,-100%)" }}>
          <span className="font-semibold">{tip.d.label}</span>: {formatValue(tip.d.value)}
        </div>
      )}
    </div>
  )
}
