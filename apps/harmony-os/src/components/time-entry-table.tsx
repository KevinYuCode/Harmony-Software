import { BorderedTableShell } from './bordered-table-shell'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@harmony/ui/components/table'
import { Button } from '@harmony/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@harmony/ui/components/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useDeleteTimeEntry } from '../hooks/use-time-entries'
import { toast } from 'sonner'
import type { TimeEntry } from '../types'

function formatTime(time: string): string {
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${m} ${ampm}`
}

function getDuration(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const totalMinutes = eh * 60 + em - (sh * 60 + sm)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

interface TimeEntryTableProps {
  entries: TimeEntry[]
  onEdit: (entry: TimeEntry) => void
  /** When set (e.g. owner view), shows which employee each row belongs to. */
  getEmployeeName?: (employeeId: string) => string | undefined
  /** Shown at the top-left inside the entry table (e.g. current employee on staff view). */
  employeeName?: string
}

export function TimeEntryTable({ entries, onEdit, getEmployeeName, employeeName }: TimeEntryTableProps) {
  const deleteEntry = useDeleteTimeEntry()

  async function handleDelete(id: string) {
    try {
      await deleteEntry.mutateAsync(id)
      toast.success('Entry deleted')
    } catch {
      toast.error('Failed to delete entry')
    }
  }

  const totalMinutes = entries.reduce((sum, e) => {
    const [sh, sm] = e.startTime.split(':').map(Number)
    const [eh, em] = e.endTime.split(':').map(Number)
    return sum + (eh * 60 + em - (sh * 60 + sm))
  }, 0)

  const totalHours = Math.floor(totalMinutes / 60)
  const totalMins = totalMinutes % 60
  const showEmployee = Boolean(getEmployeeName)
  const isEmpty = entries.length === 0

  const headerRow = (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        {showEmployee && <TableHead>Employee</TableHead>}
        <TableHead>Start</TableHead>
        <TableHead>End</TableHead>
        <TableHead>Duration</TableHead>
        <TableHead className="w-24 text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <BorderedTableShell topBar={employeeName}>
        {isEmpty ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <Table containerClassName="shrink-0">{headerRow}</Table>
            <div
              className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-12 text-center text-muted-foreground"
              role="status"
            >
              No entries for this day
            </div>
          </div>
        ) : (
          <Table>
            {headerRow}
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  {showEmployee && (
                    <TableCell className="font-medium text-foreground">
                      {getEmployeeName!(entry.employeeId) ?? '—'}
                    </TableCell>
                  )}
                  <TableCell>{formatTime(entry.startTime)}</TableCell>
                  <TableCell>{formatTime(entry.endTime)}</TableCell>
                  <TableCell>{getDuration(entry.startTime, entry.endTime)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Entry actions"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => onEdit(entry)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => void handleDelete(entry.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </BorderedTableShell>
      {entries.length > 0 && (
        <div className="pl-6 text-sm font-medium text-foreground">
          Total: {totalHours}h {totalMins > 0 ? `${totalMins}m` : ''}
        </div>
      )}
    </div>
  )
}
