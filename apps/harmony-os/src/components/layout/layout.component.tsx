import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@harmony/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@harmony/ui/components/dropdown-menu'
import { SidebarInset, SidebarProvider } from '@harmony/ui/components/sidebar'
import { CircleUser, LogOut, Settings, User } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar/app-sidebar.component'
import { formatEmployeeName } from '@/lib/employee-utils'

export function Layout({
  children,
  title,
  description,
  headerContent,
  fullWidth,
}: {
  children: React.ReactNode
  title: string
  description?: string
  headerContent?: React.ReactNode
  fullWidth?: boolean
}) {
  const navigate = useNavigate()
  const employee = useAuthStore((s) => s.employee)
  const logout = useAuthStore((s) => s.logout)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const roleLabel = employee?.role === 'owner' ? 'Admin' : 'Employee'

  return (
    <SidebarProvider className="h-screen max-h-screen">
      <AppSidebar />
      <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <header className="flex h-auto min-h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-2">
          {headerContent}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-0.5">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="truncate text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="shrink-0 rounded-full"
                aria-label="Account menu"
              >
                <CircleUser className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-medium">
                  {employee ? formatEmployeeName(employee) : ''}
                </p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <User className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <div className={`flex min-h-0 w-full flex-1 flex-col overflow-auto px-4 py-6 ${fullWidth ? '' : 'mx-auto max-w-6xl'}`}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
