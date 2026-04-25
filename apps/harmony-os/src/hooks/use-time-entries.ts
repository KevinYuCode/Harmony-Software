import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
} from '../api/time-entries';

export function useTimeEntries(employeeId: string | 'all', month: number, year: number) {
  return useQuery({
    queryKey: ['time-entries', employeeId, month, year],
    queryFn: () => getTimeEntries(employeeId, month, year),
    enabled: employeeId === 'all' || !!employeeId,
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employeeId: string;
      date: string;
      startTime: string;
      endTime: string;
    }) => createTimeEntry(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; startTime?: string; endTime?: string }) =>
      updateTimeEntry(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTimeEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
  });
}
