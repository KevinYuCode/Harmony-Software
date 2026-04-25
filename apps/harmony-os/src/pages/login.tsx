import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmployees } from '../hooks/use-employees'
import { login, adminLogin } from '../api/auth'
import { useAuthStore } from '../stores/auth-store'
import { Card, CardContent } from '@harmony/ui/components/card'
import { Input } from '@harmony/ui/components/input'
import { Button } from '@harmony/ui/components/button'
import { Avatar, AvatarFallback } from '@harmony/ui/components/avatar'
import { Skeleton } from '@harmony/ui/components/skeleton'
import { toast } from 'sonner'
import { employeeInitials, formatEmployeeName } from '../types'

export function LoginPage() {
  const navigate = useNavigate()
  const authLogin = useAuthStore((s) => s.login)
  const { data: employees, isLoading } = useEmployees()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState<'employee' | 'admin'>('employee')
  const [adminPassword, setAdminPassword] = useState('')

  const selectedEmployee = employees?.find((e) => e.id === selectedId)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) return

    setSubmitting(true)
    try {
      const res = await login(selectedId, password)
      authLogin(res.token, res.employee)
      navigate('/calendar')
    } catch {
      toast.error('Invalid password')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await adminLogin(adminPassword)
      authLogin(res.token, res.employee)
      navigate('/admin/dashboard')
    } catch {
      toast.error('Invalid admin password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen min-h-[600px] items-center justify-center overflow-hidden bg-muted">
      <div className="w-full max-w-md space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Employee Hours Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'employee' ? 'Select your profile to sign in' : 'Sign in as administrator'}
          </p>
        </div>

        {mode === 'employee' ? (
          <>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {employees?.map((emp) => (
                  <Card
                    key={emp.id}
                    className={`cursor-pointer transition-colors hover:bg-muted ${
                      selectedId === emp.id ? 'ring-2 ring-ring' : ''
                    }`}
                    onClick={() => {
                      setSelectedId(emp.id)
                      setPassword('')
                    }}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                          {employeeInitials(emp)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{formatEmployeeName(emp)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{emp.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedEmployee && (
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Enter password for{' '}
                    <span className="font-medium">{formatEmployeeName(selectedEmployee)}</span>
                  </p>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting || !password}>
                  {submitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            )}
          </>
        ) : (
          <form onSubmit={handleAdminLogin} className="space-y-3">
            <div>
              <Input
                type="password"
                placeholder="Admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !adminPassword}>
              {submitting ? 'Signing in...' : 'Sign In as Admin'}
            </Button>
          </form>
        )}

        <div className="text-center">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground underline"
            onClick={() => {
              setMode(mode === 'employee' ? 'admin' : 'employee')
              setPassword('')
              setAdminPassword('')
              setSelectedId(null)
            }}
          >
            {mode === 'employee' ? 'Sign in as Admin' : 'Sign in as Employee'}
          </button>
        </div>
      </div>
    </div>
  )
}
