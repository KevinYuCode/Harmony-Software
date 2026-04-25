import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@harmony/ui/components/dialog'
import { Button } from '@harmony/ui/components/button'
import { Input } from '@harmony/ui/components/input'
import { Label } from '@harmony/ui/components/label'
import { cn } from '@harmony/ui/lib/utils'
import { useCreateTimeEntry, useUpdateTimeEntry } from '../hooks/use-time-entries'
import { useEmployees } from '../hooks/use-employees'
import { useAuthStore } from '../stores/auth-store'
import { toast } from 'sonner'
import {
  assignableEmployeesForOwner,
  formatEmployeeName,
  type TimeEntry,
} from '../types'

interface AddEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string
  editEntry?: TimeEntry | null
}

const selectClassName = cn(
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
  'dark:bg-input/30 dark:disabled:bg-input/80',
)

export function AddEntryDialog({ open, onOpenChange, date, editEntry }: AddEntryDialogProps) {
  const employee = useAuthStore((s) => s.employee)
  const owner = employee?.role === 'owner'
  const { data: employees = [] } = useEmployees({ enabled: open && owner && !editEntry })
  const assignableEmployees = useMemo(
    () =>
      employee && employee.role === 'owner'
        ? assignableEmployeesForOwner(employees, employee)
        : [],
    [employees, employee],
  )
  const createEntry = useCreateTimeEntry()
  const updateEntry = useUpdateTimeEntry()
  const [startTime, setStartTime] = useState('16:00')
  const [endTime, setEndTime] = useState('20:00')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')

  useEffect(() => {
    if (editEntry) {
      setStartTime(editEntry.startTime.slice(0, 5))
      setEndTime(editEntry.endTime.slice(0, 5))
    } else {
      setStartTime('16:00')
      setEndTime('20:00')
    }
  }, [editEntry, open])

  useEffect(() => {
    if (!open || editEntry || !owner) return
    if (assignableEmployees.length === 0) {
      setSelectedEmployeeId('')
      return
    }
    setSelectedEmployeeId((prev) =>
      prev && assignableEmployees.some((e) => e.id === prev)
        ? prev
        : assignableEmployees[0]!.id,
    )
  }, [open, editEntry, owner, assignableEmployees])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (startTime >= endTime) {
      toast.error('End time must be after start time')
      return
    }

    try {
      if (editEntry) {
        await updateEntry.mutateAsync({ id: editEntry.id, startTime, endTime })
        toast.success('Entry updated')
      } else if (owner) {
        if (!selectedEmployeeId) {
          toast.error('Select who this time is for')
          return
        }
        await createEntry.mutateAsync({
          employeeId: selectedEmployeeId,
          date,
          startTime,
          endTime,
        })
        toast.success('Entry added')
      } else {
        await createEntry.mutateAsync({
          employeeId: employee!.id,
          date,
          startTime,
          endTime,
        })
        toast.success('Entry added')
      }
      onOpenChange(false)
    } catch {
      toast.error('Failed to save entry')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editEntry ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editEntry && owner && (
            <div className="space-y-2">
              <Label htmlFor="entry-employee">Employee</Label>
              <select
                id="entry-employee"
                className={selectClassName}
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                disabled={assignableEmployees.length === 0}
                required
              >
                {assignableEmployees.length === 0 ? (
                  <option value="">No one available</option>
                ) : (
                  assignableEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {formatEmployeeName(e)}
                      {e.id === employee?.id ? ' (you)' : ''}
                    </option>
                  ))
                )}
              </select>
              {assignableEmployees.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No accounts are available to attach this entry to.
                </p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="start-time">Start Time</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">End Time</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createEntry.isPending ||
                updateEntry.isPending ||
                (!editEntry && owner && assignableEmployees.length === 0)
              }
            >
              {editEntry ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
