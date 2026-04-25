import { useMemo, useState } from 'react'
import { useAuthStore } from '../stores/auth-store'
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '../hooks/use-employees'
import { Layout } from '../components/layout'
import { BorderedTableShell } from '../components/bordered-table-shell'
import { Button } from '@harmony/ui/components/button'
import { Input } from '@harmony/ui/components/input'
import { Label } from '@harmony/ui/components/label'
import { Badge } from '@harmony/ui/components/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@harmony/ui/components/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@harmony/ui/components/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@harmony/ui/components/dialog'
import { MoreVertical, Pencil, Trash2, UserPlus, X, Check, Search } from 'lucide-react'
import { toast } from 'sonner'
import { formatEmployeeName } from '../types'

export function AdminDashboardPage() {
  const currentEmployee = useAuthStore((s) => s.employee)
  const { data: employees = [], isLoading } = useEmployees()
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const deleteEmployee = useDeleteEmployee()

  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'employee' | 'owner'>('employee')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState<'employee' | 'owner'>('employee')

  const [nameFilter, setNameFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'employee' | 'owner'>('all')

  const filteredEmployees = useMemo(() => {
    const q = nameFilter.trim().toLowerCase()
    return employees.filter((emp) => {
      if (roleFilter !== 'all' && emp.role !== roleFilter) return false
      if (q) {
        const full = formatEmployeeName(emp).toLowerCase()
        if (full.includes(q)) return true
        return (
          emp.firstName.toLowerCase().includes(q) || emp.lastName.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [employees, nameFilter, roleFilter])

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newFirstName.trim() || !newPassword.trim()) return
    createEmployee.mutate(
      {
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        password: newPassword,
        role: newRole,
      },
      {
        onSuccess: () => {
          toast.success('Employee created')
          setNewFirstName('')
          setNewLastName('')
          setNewPassword('')
          setNewRole('employee')
          setAddDialogOpen(false)
        },
        onError: () => toast.error('Failed to create employee'),
      },
    )
  }

  function startEdit(emp: {
    id: string
    firstName: string
    lastName: string
    role: 'owner' | 'employee'
  }) {
    setEditingId(emp.id)
    setEditFirstName(emp.firstName)
    setEditLastName(emp.lastName)
    setEditPassword('')
    setEditRole(emp.role)
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !editFirstName.trim()) return
    const data: {
      firstName?: string
      lastName?: string
      password?: string
      role?: 'owner' | 'employee'
    } = {
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      role: editRole,
    }
    if (editPassword) data.password = editPassword
    updateEmployee.mutate(
      { id: editingId, data },
      {
        onSuccess: () => {
          toast.success('Employee updated')
          setEditingId(null)
        },
        onError: () => toast.error('Failed to update employee'),
      },
    )
  }

  function handleDelete(id: string, name: string) {
    if (id === currentEmployee?.id) {
      toast.error("You can't delete your own account")
      return
    }
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return
    deleteEmployee.mutate(id, {
      onSuccess: () => toast.success(`${name} deleted`),
      onError: () => toast.error('Failed to delete employee'),
    })
  }

  return (
    <Layout
      title="Manage employees"
      description="Add accounts, assign roles, and keep your team roster up to date."
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <Dialog
          open={addDialogOpen}
          onOpenChange={(open) => {
            setAddDialogOpen(open)
            if (!open) {
              setNewFirstName('')
              setNewLastName('')
              setNewPassword('')
              setNewRole('employee')
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl">
            <form onSubmit={handleCreate} className="space-y-4">
              <DialogHeader>
                <DialogTitle>New Employee</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label htmlFor="new-first-name">First name</Label>
                  <Input
                    id="new-first-name"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="First name"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-last-name">Last name</Label>
                  <Input
                    id="new-last-name"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-password">Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-role">Role</Label>
                  <select
                    id="new-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'employee' | 'owner')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="employee">Employee</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={createEmployee.isPending || !newFirstName.trim() || !newPassword.trim()}
                >
                  {createEmployee.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {!isLoading && (
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            {employees.length > 0 && (
              <>
                <div className="space-y-1 flex-1 min-w-0 max-w-md">
                  <Label htmlFor="employee-name-filter">Search by name</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="employee-name-filter"
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      placeholder="Filter by name..."
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1 w-full sm:w-44 shrink-0">
                  <Label htmlFor="employee-role-filter">Role</Label>
                  <select
                    id="employee-role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as 'all' | 'employee' | 'owner')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="all">All roles</option>
                    <option value="employee">Employee</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </>
            )}
            <Button
              className="shrink-0 self-end sm:ml-auto"
              onClick={() => setAddDialogOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        )}

        <BorderedTableShell>
          <Table className="w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>First name</TableHead>
                  <TableHead>Last name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[200px]">Password</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      <div className="flex min-h-[min(50vh,24rem)] items-center justify-center">
                        Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      <div className="flex min-h-[min(50vh,24rem)] items-center justify-center">
                        No employees yet
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      <div className="flex min-h-[min(50vh,24rem)] items-center justify-center">
                        No employees match your filters
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) =>
                    editingId === emp.id ? (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <Input
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            className="h-8"
                            placeholder="First name"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            className="h-8"
                            placeholder="Last name"
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as 'employee' | 'owner')}
                            disabled={emp.id === currentEmployee?.id}
                            className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="employee">Employee</option>
                            <option value="owner">Owner</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder="Leave blank to keep"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <form onSubmit={handleUpdate} className="inline-flex gap-1">
                            <Button
                              type="submit"
                              variant="outline"
                              size="icon-xs"
                              disabled={updateEmployee.isPending}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-xs"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">
                          {emp.firstName}
                          {emp.id === currentEmployee?.id && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{emp.lastName}</TableCell>
                        <TableCell>
                          <Badge variant={emp.role === 'owner' ? 'default' : 'secondary'}>
                            {emp.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">********</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon-xs"
                                  aria-label="Employee actions"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => startEdit(emp)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  disabled={emp.id === currentEmployee?.id}
                                  onSelect={() => handleDelete(emp.id, formatEmployeeName(emp))}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ),
                  )
                )}
              </TableBody>
          </Table>
        </BorderedTableShell>
      </div>
    </Layout>
  )
}
