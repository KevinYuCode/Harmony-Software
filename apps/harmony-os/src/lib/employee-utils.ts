import type { Employee } from '@/types'

export function assignableEmployeesForOwner(
  roster: Employee[],
  current: Employee,
): Employee[] {
  if (current.role !== 'owner') return []
  const staff = roster.filter((e) => e.role === 'employee')
  const self = roster.find((e) => e.id === current.id) ?? current
  return [self, ...staff]
}

export function formatEmployeeName(emp: Pick<Employee, 'firstName' | 'lastName'>): string {
  return [emp.firstName, emp.lastName].filter(Boolean).join(' ').trim() || emp.firstName
}

export function employeeInitials(emp: Pick<Employee, 'firstName' | 'lastName'>): string {
  const first = emp.firstName.trim()
  const last = emp.lastName.trim()
  if (first && last) {
    return (first[0]! + last[0]!).toUpperCase()
  }
  if (first.length >= 2) {
    return first.slice(0, 2).toUpperCase()
  }
  return (first[0] ?? '?').toUpperCase()
}
