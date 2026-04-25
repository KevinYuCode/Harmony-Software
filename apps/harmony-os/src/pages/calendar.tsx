import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from 'date-fns'
import { useAuthStore } from '../stores/auth-store'
import { useTimeEntries } from '../hooks/use-time-entries'
import { useEmployees } from '../hooks/use-employees'
import { Layout } from '../components/layout'
import { Button } from '@harmony/ui/components/button'
import { Badge } from '@harmony/ui/components/badge'
import { cn } from '@harmony/ui/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatEmployeeName, type TimeEntry } from '../types'

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const EMPLOYEE_BADGE_PALETTE = [
  'bg-sky-100 text-sky-900 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-100 dark:border-sky-800/60',
  'bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-100 dark:border-emerald-800/60',
  'bg-violet-100 text-violet-900 border-violet-200/80 dark:bg-violet-950/50 dark:text-violet-100 dark:border-violet-800/60',
  'bg-amber-100 text-amber-900 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-100 dark:border-amber-800/60',
  'bg-rose-100 text-rose-900 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-100 dark:border-rose-800/60',
  'bg-cyan-100 text-cyan-900 border-cyan-200/80 dark:bg-cyan-950/50 dark:text-cyan-100 dark:border-cyan-800/60',
  'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200/80 dark:bg-fuchsia-950/50 dark:text-fuchsia-100 dark:border-fuchsia-800/60',
  'bg-lime-100 text-lime-900 border-lime-200/80 dark:bg-lime-950/50 dark:text-lime-100 dark:border-lime-800/60',
] as const

function hashEmployeeId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function paletteForEmployeeId(id: string): string {
  return EMPLOYEE_BADGE_PALETTE[hashEmployeeId(id) % EMPLOYEE_BADGE_PALETTE.length]
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase()
  }
  return (parts[0]?.[0] ?? '?').toUpperCase()
}

function getHoursByEmployeeForDay(
  entries: TimeEntry[],
  dateStr: string,
): { employeeId: string; hours: number }[] {
  const dayEntries = entries.filter((e) => e.date === dateStr)
  const byEmp = new Map<string, number>()
  for (const e of dayEntries) {
    const mins = parseTimeToMinutes(e.endTime) - parseTimeToMinutes(e.startTime)
    const h = mins / 60
    byEmp.set(e.employeeId, (byEmp.get(e.employeeId) ?? 0) + h)
  }
  return Array.from(byEmp.entries())
    .map(([employeeId, hours]) => ({
      employeeId,
      hours: Math.round(hours * 10) / 10,
    }))
    .filter((x) => x.hours > 0)
    .sort((a, b) => a.employeeId.localeCompare(b.employeeId))
}

export function CalendarPage() {
  const navigate = useNavigate()
  const employee = useAuthStore((s) => s.employee)
  const isOwner = useAuthStore((s) => s.isOwner)
  const [currentDate, setCurrentDate] = useState(new Date())

  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  const entryScope = isOwner() ? 'all' : employee?.id || ''
  const { data: entries = [] } = useTimeEntries(entryScope, month, year)
  const { data: employees = [] } = useEmployees({ enabled: isOwner() })

  const nameByEmployeeId = useMemo(() => {
    const map = new Map<string, string>()
    if (employee) map.set(employee.id, formatEmployeeName(employee))
    for (const e of employees) {
      map.set(e.id, formatEmployeeName(e))
    }
    return map
  }, [employee, employees])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekCount = days.length / 7

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Layout
      title="Calendar"
      description="Browse hours by month and open a day to view or edit time entries."
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentDate((d) => subMonths(d, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentDate((d) => addMonths(d, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
          <div className="grid shrink-0 grid-cols-7 border-b border-border">
            {weekDays.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-xs font-medium uppercase text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div
            className="grid min-h-0 flex-1 grid-cols-7"
            style={{
              gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))`,
            }}
          >
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const perEmployee = getHoursByEmployeeForDay(entries, dateStr)
              const inMonth = isSameMonth(day, currentDate)
              const today = isToday(day)

              return (
                <div
                  key={dateStr}
                  className={`min-h-0 cursor-pointer border-b border-r border-border p-2 transition-colors hover:bg-muted ${
                    !inMonth ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => navigate(`/calendar/${dateStr}`)}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm ${
                        today
                          ? 'bg-primary font-medium text-primary-foreground'
                          : inMonth
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="flex min-w-0 flex-col items-end gap-0.5">
                      {perEmployee.map(({ employeeId, hours }) => {
                        const name = nameByEmployeeId.get(employeeId) ?? `User ${employeeId.slice(0, 4)}`
                        const initials = initialsFromName(name)
                        const palette = paletteForEmployeeId(employeeId)
                        return (
                          <Badge
                            key={employeeId}
                            variant="outline"
                            className={cn(
                              'h-auto min-h-5 gap-1 border px-1 py-0.5 text-[10px] leading-tight',
                              palette,
                            )}
                            title={name}
                          >
                            <span
                              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/15 text-[9px] font-bold leading-none dark:bg-white/15"
                              aria-hidden
                            >
                              {initials}
                            </span>
                            <span>{hours}h</span>
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
