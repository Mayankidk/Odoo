import { useState } from "react"

interface LineSeries { label: string; color: string; values: number[] }
interface Props { labels: string[]; series: LineSeries[]; height?: number; formatValue?: (v: number) => string }

export function MultiLineChart({ labels, series, height = 200, formatValue = (v) => String(v) }: Props) {
  const [tip, setTip] = useState<{ xi: number; x: number; y: number } | null>(null)
  if (!labels.length) return <div className="text-slate-400 text-sm text-center py-8">No data</div>

  const allVals = series.flatMap((s) => s.values)
  const max = Math.max(...allVals, 1)
  const W = 480; const H = height
  const padL = 36; const padR = 12; const padT = 12; const padB = 32
  const chartW = W - padL - padR; const chartH = H - padT - padB

  const xOf = (i: number) => padL + (i / Math.max(labels.length - 1, 1)) * chartW
  const yOf = (v: number) => padT + chartH - (v / max) * chartH

  const gridVals = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
        {/* gridlines */}
        {gridVals.map((f) => {
          const y = padT + chartH - f * chartH
          return (
            <g key={f}>
              <line x1={padL} x2={W - padR} y1={y} y2={y}
                stroke="#e2e8f0" strokeWidth={f === 0 ? 1.5 : 0.75}
                strokeDasharray={f === 0 ? undefined : "3 3"} />
              <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">
                {formatValue(Math.round(f * max))}
              </text>
            </g>
          )
        })}
        {/* x-axis labels */}
        {labels.map((l, i) => (
          <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#94a3b8">
            {l.length > 6 ? l.slice(0, 5) + "…" : l}
          </text>
        ))}
        {/* series */}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ")
          const fillPts = [
            `${xOf(0)},${padT + chartH}`,
            ...s.values.map((v, i) => `${xOf(i)},${yOf(v)}`),
            `${xOf(labels.length - 1)},${padT + chartH}`,
          ].join(" ")
          return (
            <g key={s.label}>
              <polygon points={fillPts} fill={s.color} fillOpacity={0.08} />
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.5}
                strokeLinejoin="round" strokeLinecap="round" />
              {s.values.map((v, i) => (
                <circle key={i} cx={xOf(i)} cy={yOf(v)} r={tip?.xi === i ? 5 : 3.5}
                  fill={s.color} stroke="#fff" strokeWidth={1.5}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setTip({ xi: i, x: xOf(i), y: yOf(v) })}
                  onMouseLeave={() => setTip(null)} />
              ))}
            </g>
          )
        })}
        {/* hover line */}
        {tip !== null && (
          <line x1={xOf(tip.xi)} x2={xOf(tip.xi)} y1={padT} y2={padT + chartH}
            stroke="#64748b" strokeWidth={1} strokeDasharray="4 3" />
        )}
      </svg>
      {tip !== null && (
        <div className="pointer-events-none absolute z-20 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl min-w-[120px]"
          style={{ left: `${(tip.x / W) * 100}%`, top: 0, transform: "translate(-50%,8px)" }}>
          <p className="font-semibold mb-1 text-slate-300">{labels[tip.xi]}</p>
          {series.map((s) => (
            <p key={s.label} className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: s.color }} />
              {s.label}: <span className="font-bold">{formatValue(s.values[tip.xi])}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
