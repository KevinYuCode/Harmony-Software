import { api } from './client';
import type { LoginResponse } from '../types';

export function login(employeeId: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { employeeId, password });
}

export function adminLogin(password: string) {
  return api.post<LoginResponse>('/auth/admin-login', { password });
}
