import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth-store'
import { ProtectedRoute } from './components/protected-route'
import { OwnerRoute } from './components/owner-route'
import { LoginPage } from './pages/login'
import { CalendarPage } from './pages/calendar'
import { DayDetailPage } from './pages/day-detail'
import { AdminDashboardPage } from './pages/admin-dashboard'
import { DocumentsPage } from './pages/documents'
import { CppTablePage } from './pages/cpp-table'
import { Toaster } from '@harmony/ui/components/sonner'

function App() {
  const token = useAuthStore((s) => s.token)

  return (
    <>
      <Toaster />
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/calendar" replace /> : <LoginPage />}
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar/:date"
          element={
            <ProtectedRoute>
              <DayDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <OwnerRoute>
              <AdminDashboardPage />
            </OwnerRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cpp-table"
          element={
            <ProtectedRoute>
              <CppTablePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={token ? '/calendar' : '/login'} replace />} />
      </Routes>
    </>
  )
}

export default App
