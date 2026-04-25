export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'employee';
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  employee: Employee;
}
