import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';

export function OwnerRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const isOwner = useAuthStore((s) => s.isOwner);

  if (!token) return <Navigate to="/login" replace />;
  if (!isOwner()) return <Navigate to="/calendar" replace />;

  return <>{children}</>;
}
