import { useEffect, useRef } from 'react'
import type { TimeEntry } from '../types'

/** Fixed row height per hour so slots stay readable and the day scrolls vertically. */
const HOUR_HEIGHT_PX = 56
const TIMELINE_BODY_PX = 24 * HOUR_HEIGHT_PX

const HOURS = Array.from({ length: 24 }, (_, i) => i)

/** Hour digit(s) 1–12 plus meridiem, for a fixed-width number column in the gutter. */
function formatHourParts(hour: number): { h: string; meridiem: 'AM' | 'PM' } {
  if (hour === 0) return { h: '12', meridiem: 'AM' }
  if (hour < 12) return { h: String(hour), meridiem: 'AM' }
  if (hour === 12) return { h: '12', meridiem: 'PM' }
  return { h: String(hour - 12), meridiem: 'PM' }
}

function timeToFraction(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h + m / 60) / 24
}

interface TimelineViewProps {
  entries: TimeEntry[]
  getEmployeeName?: (employeeId: string) => string | undefined
}

export function TimelineView({ entries, getEmployeeName }: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const firstEntry = entries[0]
    const scrollTo = firstEntry
      ? timeToFraction(firstEntry.startTime) * TIMELINE_BODY_PX - 40
      : (6 / 24) * TIMELINE_BODY_PX - 40
    el.scrollTop = Math.max(0, scrollTo)
  }, [entries])

  const contentHeightPx = TIMELINE_BODY_PX

  return (
    <div
      ref={scrollRef}
      className="h-full min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[inherit]"
    >
      <div className="relative w-full" style={{ height: contentHeightPx }}>
        <div
          className="pointer-events-none absolute z-10 w-px bg-border"
          style={{
            left: '4rem',
            top: 0,
            height: TIMELINE_BODY_PX,
          }}
          aria-hidden
        />
        <div className="absolute inset-x-0 top-0" style={{ height: TIMELINE_BODY_PX }}>
          {HOURS.map((hour) => {
            const { h, meridiem } = formatHourParts(hour)
            return (
              <div
                key={hour}
                className={
                  hour === 0
                    ? 'absolute left-0 right-0'
                    : 'absolute left-0 right-0 border-t border-border'
                }
                style={{
                  top: hour * HOUR_HEIGHT_PX,
                  height: HOUR_HEIGHT_PX,
                }}
              >
                <span className="absolute left-0 top-0 flex w-16 items-baseline justify-end gap-0 pt-0.5 pr-2 text-xs tabular-nums leading-none text-muted-foreground">
                  <span className="min-w-[2ch] shrink-0 text-right">{h}</span>
                  <span className="whitespace-nowrap">
                    {' '}
                    {meridiem}
                  </span>
                </span>
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-border/50"
                  style={{ top: '50%' }}
                />
              </div>
            )
          })}
        </div>

        {entries.map((entry) => {
          const topFrac = timeToFraction(entry.startTime)
          const bottomFrac = timeToFraction(entry.endTime)
          const spanFrac = Math.max(bottomFrac - topFrac, 0)
          const name = getEmployeeName?.(entry.employeeId)
          const minPx = name ? 36 : 20

          return (
            <div
              key={entry.id}
              className="absolute left-16 right-2 rounded-md border border-emerald-300 bg-emerald-100 px-2 py-1"
              style={{
                top: topFrac * TIMELINE_BODY_PX,
                height: `max(${spanFrac * TIMELINE_BODY_PX}px, ${minPx}px)`,
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-emerald-800">
                  {entry.startTime.slice(0, 5)} - {entry.endTime.slice(0, 5)}
                </span>
                {name ? (
                  <span className="truncate text-[10px] font-medium text-emerald-900/80">{name}</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
