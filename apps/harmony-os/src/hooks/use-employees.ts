import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api/employees';
import type { Employee } from '../types';

export function useEmployees(options?: Pick<UseQueryOptions<Employee[]>, 'enabled'>) {
  return useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    ...options,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      password: string;
      role?: 'owner' | 'employee';
    }) => createEmployee(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        firstName?: string;
        lastName?: string;
        password?: string;
        role?: 'owner' | 'employee';
      };
    }) => updateEmployee(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });
}
