import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useAuthStore } from '../stores/auth-store'
import { useTimeEntries } from '../hooks/use-time-entries'
import { useEmployees } from '../hooks/use-employees'
import { Layout } from '../components/layout'
import { TimeEntryTable } from '../components/time-entry-table'
import { TimelineView } from '../components/timeline-view'
import { AddEntryDialog } from '../components/add-entry-dialog'
import { Button } from '@harmony/ui/components/button'
import { ArrowLeft, Plus } from 'lucide-react'
import {
  assignableEmployeesForOwner,
  formatEmployeeName,
  type TimeEntry,
} from '../types'

export function DayDetailPage() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const employee = useAuthStore((s) => s.employee)
  const isOwner = useAuthStore((s) => s.isOwner)
  const { data: employees = [] } = useEmployees({ enabled: isOwner() })
  const assignableEmployees = useMemo(
    () =>
      employee && employee.role === 'owner'
        ? assignableEmployeesForOwner(employees, employee)
        : [],
    [employees, employee],
  )
  const nameByEmployeeId = useMemo(() => {
    const map = new Map<string, string>()
    if (employee) map.set(employee.id, formatEmployeeName(employee))
    for (const e of employees) {
      map.set(e.id, formatEmployeeName(e))
    }
    return map
  }, [employee, employees])
  const getEmployeeName = isOwner()
    ? (id: string) => nameByEmployeeId.get(id)
    : undefined
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null)

  const parsedDate = parseISO(date!)
  const month = parsedDate.getMonth() + 1
  const year = parsedDate.getFullYear()

  const entryScope = isOwner() ? 'all' : employee?.id || ''
  const { data: allEntries = [] } = useTimeEntries(entryScope, month, year)
  const dayEntries = allEntries
    .filter((e) => e.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  function handleEdit(entry: TimeEntry) {
    setEditEntry(entry)
    setDialogOpen(true)
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open) setEditEntry(null)
  }

  return (
    <Layout
      title={format(parsedDate, 'EEEE, MMMM d, yyyy')}
      description="Review and edit time entries for this day."
      headerContent={
        <Button
          variant="ghost"
          size="icon-sm"
          className="self-start"
          onClick={() => navigate('/calendar')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_350px] lg:grid-rows-[auto_minmax(0,1fr)] lg:min-h-0">
          {/* Row 1: toolbar only in col 1; col 2 stays empty so row 2 aligns table ↔ timeline */}
          <div className="flex shrink-0 justify-end lg:col-start-1 lg:row-start-1">
            <Button
              onClick={() => setDialogOpen(true)}
                disabled={isOwner() && assignableEmployees.length === 0}
                title={
                  isOwner() && assignableEmployees.length === 0
                    ? 'No account available to log time for'
                    : undefined
                }
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Entry
            </Button>
          </div>
          <div
            className="hidden min-h-0 lg:col-start-2 lg:row-start-1 lg:block"
            aria-hidden
          />
          <div className="flex min-h-0 flex-col overflow-hidden lg:col-start-1 lg:row-start-2 lg:min-h-0">
            <TimeEntryTable
              entries={dayEntries}
              onEdit={handleEdit}
              getEmployeeName={getEmployeeName}
              employeeName={
                !isOwner() && employee ? formatEmployeeName(employee) : undefined
              }
            />
          </div>
          <div className="flex max-h-[min(36rem,calc(100vh-9rem))] min-h-0 flex-col overflow-hidden rounded-lg border border-border lg:col-start-2 lg:row-start-2 lg:max-h-none lg:h-full lg:min-h-0">
            <TimelineView entries={dayEntries} getEmployeeName={getEmployeeName} />
          </div>
        </div>
      </div>

      <AddEntryDialog
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        date={date!}
        editEntry={editEntry}
      />
    </Layout>
  )
}
