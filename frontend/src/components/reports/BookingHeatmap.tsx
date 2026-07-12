import type { HeatmapCell } from "@/lib/database.types"

interface Props { data: HeatmapCell[] | null }

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function fmt12(h: number) {
  if (h === 0) return "12am"
  if (h === 12) return "12pm"
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

export function BookingHeatmap({ data }: Props) {
  if (!data || !data.length) {
    return (
      <div className="text-slate-400 text-sm text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        No booking data available for heatmap
      </div>
    )
  }

  // map for quick lookup
  const cellMap = new Map<string, number>()
  let maxCount = 1
  for (const c of data) {
    const key = `${c.day_of_week}-${c.hour}`
    cellMap.set(key, c.count)
    if (c.count > maxCount) maxCount = c.count
  }

  function intensity(count: number) {
    if (!count) return 0
    return count / maxCount
  }

  function cellColor(count: number) {
    const t = intensity(count)
    if (!t) return "#f8fafc"
    // interpolate from indigo-100 → indigo-700
    const r = Math.round(224 - t * (224 - 67))
    const g = Math.round(231 - t * (231 - 56))
    const b = Math.round(255 - t * (255 - 202))
    return `rgb(${r},${g},${b})`
  }

  // show only every 3 hours to avoid overflow
  const visibleHours = HOURS.filter((h) => h % 3 === 0)

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* hour labels */}
        <div className="flex" style={{ paddingLeft: "40px" }}>
          {HOURS.map((h) => (
            <div key={h} className="flex-1 text-center" style={{ minWidth: "22px" }}>
              {h % 3 === 0 && (
                <span className="text-[9px] text-slate-400">{fmt12(h)}</span>
              )}
            </div>
          ))}
        </div>
        {/* rows */}
        {DAYS.map((day, di) => (
          <div key={di} className="flex items-center gap-0.5 mt-0.5">
            <span className="text-[10px] text-slate-500 w-10 text-right pr-1.5 flex-shrink-0">{day}</span>
            {HOURS.map((h) => {
              const count = cellMap.get(`${di}-${h}`) ?? 0
              return (
                <div
                  key={h}
                  title={`${day} ${fmt12(h)}: ${count} booking${count !== 1 ? "s" : ""}`}
                  className="flex-1 rounded-sm transition-all hover:ring-2 hover:ring-indigo-400 cursor-pointer"
                  style={{
                    minWidth: "22px",
                    height: "22px",
                    backgroundColor: cellColor(count),
                  }}
                />
              )
            })}
          </div>
        ))}
        {/* legend */}
        <div className="flex items-center gap-2 mt-3 ml-10">
          <span className="text-[9px] text-slate-400">Less</span>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
            <div
              key={t}
              className="w-3.5 h-3.5 rounded-sm"
              style={{ backgroundColor: t === 0 ? "#f8fafc" : `rgb(${Math.round(224 - t * 157)},${Math.round(231 - t * 175)},${Math.round(255 - t * 53)})` }}
            />
          ))}
          <span className="text-[9px] text-slate-400">More</span>
        </div>
      </div>
    </div>
  )
}
