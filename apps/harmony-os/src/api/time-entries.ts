import { api } from './client';
import type { TimeEntry } from '../types';

export function getTimeEntries(employeeId: string | 'all', month: number, year: number) {
  if (employeeId === 'all') {
    return api.get<TimeEntry[]>(`/time-entries?month=${month}&year=${year}&all=true`);
  }
  return api.get<TimeEntry[]>(
    `/time-entries?employeeId=${employeeId}&month=${month}&year=${year}`,
  );
}

export function createTimeEntry(data: {
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  return api.post<TimeEntry>('/time-entries', data);
}

export function updateTimeEntry(id: string, data: { startTime?: string; endTime?: string }) {
  return api.put<TimeEntry>(`/time-entries/${id}`, data);
}

export function deleteTimeEntry(id: string) {
  return api.del<{ success: boolean }>(`/time-entries/${id}`);
}
