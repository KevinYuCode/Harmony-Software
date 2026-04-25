import { api } from './client';
import type { Employee } from '../types';

export function getEmployees() {
  return api.get<Employee[]>('/employees');
}

export function createEmployee(data: {
  firstName: string;
  lastName: string;
  password: string;
  role?: 'owner' | 'employee';
}) {
  return api.post<Employee>('/employees', data);
}

export function updateEmployee(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    password?: string;
    role?: 'owner' | 'employee';
  },
) {
  return api.put<Employee>(`/employees/${id}`, data);
}

export function deleteEmployee(id: string) {
  return api.del<{ success: boolean }>(`/employees/${id}`);
}
