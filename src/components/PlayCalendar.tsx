"use client"

import { useMemo, useState } from "react"

interface PlayDate {
  date: string // YYYY-MM-DD
  count: number
}

interface Props {
  playDates: PlayDate[]
}

const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
const DAY_LABELS = ["月", "", "水", "", "金", "", ""]

function getCellColor(count: number): string {
  if (count === 0) return "bg-amber-100/40"
  if (count === 1) return "bg-amber-300"
  if (count === 2) return "bg-amber-500"
  return "bg-amber-700"
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-")
  return `${y}年${Number(m)}月${Number(d)}日`
}

export function PlayCalendar({ playDates }: Props) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null)

  const { weeks, monthLabels } = useMemo(() => {
    // Build date → count map
    const countMap = new Map<string, number>()
    for (const { date, count } of playDates) {
      countMap.set(date, count)
    }

    // Calculate grid: 53 weeks × 7 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from ~1 year ago, aligned to Sunday
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 364)
    // Align to Sunday (start of week)
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)

    const weeks: { date: string; count: number; isInRange: boolean }[][] = []
    const monthLabelPositions: { month: number; col: number }[] = []

    let currentDate = new Date(startDate)
    let lastMonth = -1

    for (let week = 0; week < 53; week++) {
      const weekDays: { date: string; count: number; isInRange: boolean }[] = []

      for (let day = 0; day < 7; day++) {
        const dateStr = formatDate(currentDate)
        const count = countMap.get(dateStr) ?? 0
        const isInRange = currentDate <= today

        // Track month boundaries (check on first day of week)
        if (day === 0 && currentDate.getMonth() !== lastMonth) {
          lastMonth = currentDate.getMonth()
          monthLabelPositions.push({ month: lastMonth, col: week })
        }

        weekDays.push({ date: dateStr, count, isInRange })
        currentDate.setDate(currentDate.getDate() + 1)
      }

      weeks.push(weekDays)
    }

    return { weeks, monthLabels: monthLabelPositions }
  }, [playDates])

  const totalPlaysInYear = playDates.reduce((sum, p) => sum + p.count, 0)

  return (
    <div className="wood-card rounded-2xl p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-amber-800">
          過去1年間で <span className="font-bold text-amber-950">{totalPlaysInYear}回</span> プレイ
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="mb-1 flex" style={{ paddingLeft: "28px" }}>
            {monthLabels.map(({ month, col }, i) => (
              <div
                key={i}
                className="text-xs text-amber-700/60"
                style={{
                  position: "absolute" as const,
                  left: `${col * 14 + 28}px`,
                }}
              />
            ))}
            {/* Render month labels with proper spacing */}
            <div className="relative h-4 w-full">
              {monthLabels.map(({ month, col }, i) => (
                <span
                  key={i}
                  className="absolute text-xs text-amber-700/60"
                  style={{ left: `${col * 14}px` }}
                >
                  {MONTH_LABELS[month]}
                </span>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 pr-1">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="flex h-[12px] w-5 items-center justify-end">
                  <span className="text-[10px] text-amber-700/60">{label}</span>
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-0.5">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={`h-[12px] w-[12px] rounded-sm ${
                      day.isInRange ? getCellColor(day.count) : "bg-transparent"
                    } ${day.isInRange ? "cursor-pointer" : ""}`}
                    onMouseEnter={(e) => {
                      if (!day.isInRange) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({
                        date: day.date,
                        count: day.count,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-amber-700/60">
        <span>少ない</span>
        <div className="h-[12px] w-[12px] rounded-sm bg-amber-100/40" />
        <div className="h-[12px] w-[12px] rounded-sm bg-amber-300" />
        <div className="h-[12px] w-[12px] rounded-sm bg-amber-500" />
        <div className="h-[12px] w-[12px] rounded-sm bg-amber-700" />
        <span>多い</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg bg-amber-950 px-3 py-1.5 text-xs text-white shadow-lg"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 36}px`,
            transform: "translateX(-50%)",
          }}
        >
          {formatDisplayDate(tooltip.date)}: {tooltip.count}回プレイ
        </div>
      )}
    </div>
  )
}
