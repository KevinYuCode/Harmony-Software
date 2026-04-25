import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@harmony/ui/components/dialog'
import { Button } from '@harmony/ui/components/button'
import { Input } from '@harmony/ui/components/input'
import { Label } from '@harmony/ui/components/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@harmony/ui/components/table'
import { useEmployees, useCreateEmployee, useDeleteEmployee } from '../hooks/use-employees'
import { Settings, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatEmployeeName } from '../types'

export function ManageEmployeesDialog() {
  const { data: employees } = useEmployees()
  const createEmployee = useCreateEmployee()
  const deleteEmployee = useDeleteEmployee()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !password) return

    try {
      await createEmployee.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      })
      setFirstName('')
      setLastName('')
      setPassword('')
      toast.success('Employee created')
    } catch {
      toast.error('Failed to create employee')
    }
  }

  async function handleDelete(id: string, employeeName: string) {
    try {
      await deleteEmployee.mutateAsync(id)
      toast.success(`${employeeName} deleted`)
    } catch {
      toast.error('Failed to delete employee')
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-1.5 h-4 w-4" />
          Manage Employees
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Employees</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
          <div className="min-w-[120px] flex-1 space-y-1">
            <Label htmlFor="emp-first" className="text-xs">
              First name
            </Label>
            <Input
              id="emp-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
            />
          </div>
          <div className="min-w-[120px] flex-1 space-y-1">
            <Label htmlFor="emp-last" className="text-xs">
              Last name
            </Label>
            <Input
              id="emp-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="emp-pass" className="text-xs">
              Password
            </Label>
            <Input
              id="emp-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="mt-5"
            disabled={createEmployee.isPending || !firstName.trim()}
          >
            Add
          </Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>First name</TableHead>
              <TableHead>Last name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees?.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>{emp.firstName}</TableCell>
                <TableCell>{emp.lastName}</TableCell>
                <TableCell className="capitalize">{emp.role}</TableCell>
                <TableCell>
                  {emp.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(emp.id, formatEmployeeName(emp))}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
