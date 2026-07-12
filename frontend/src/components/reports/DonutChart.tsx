interface Slice { label: string; value: number; color: string }
interface Props { data: Slice[]; size?: number; showLegend?: boolean }

export function DonutChart({ data, size = 160, showLegend = true }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <div className="text-slate-400 text-sm text-center py-8">No data</div>

  const cx = size / 2; const cy = size / 2
  const R = size * 0.42; const r = size * 0.26
  let cumAngle = -Math.PI / 2

  const arcs = data.map((d) => {
    const fraction = d.value / total
    const startAngle = cumAngle
    cumAngle += fraction * 2 * Math.PI
    const endAngle = cumAngle
    const largeArc = fraction > 0.5 ? 1 : 0
    const x1 = cx + R * Math.cos(startAngle); const y1 = cy + R * Math.sin(startAngle)
    const x2 = cx + R * Math.cos(endAngle); const y2 = cy + R * Math.sin(endAngle)
    const ix1 = cx + r * Math.cos(endAngle); const iy1 = cy + r * Math.sin(endAngle)
    const ix2 = cx + r * Math.cos(startAngle); const iy2 = cy + r * Math.sin(startAngle)
    const midAngle = startAngle + (fraction * 2 * Math.PI) / 2
    return { ...d, path: `M${x1},${y1} A${R},${R} 0 ${largeArc} 1 ${x2},${y2} L${ix1},${iy1} A${r},${r} 0 ${largeArc} 0 ${ix2},${iy2} Z`, midAngle, fraction }
  })

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="flex-shrink-0">
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color} className="transition-opacity hover:opacity-80 cursor-pointer" />
        ))}
        <circle cx={cx} cy={cy} r={r - 4} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1e293b">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="#94a3b8">Total</text>
      </svg>
      {showLegend && (
        <div className="flex flex-col gap-2 flex-1 min-w-[120px]">
          {arcs.map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: a.color }} />
                <span className="text-slate-600 capitalize">{a.label}</span>
              </div>
              <span className="font-semibold text-slate-700">{a.value} <span className="font-normal text-slate-400">({Math.round(a.fraction * 100)}%)</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
