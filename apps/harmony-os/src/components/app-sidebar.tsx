import { Link, useLocation } from 'react-router-dom'
import { CalendarDays, Users, TableProperties } from 'lucide-react'
import { useAuthStore } from '../stores/auth-store'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@harmony/ui/components/sidebar'
import logo from '@/assets/harmony-logo.png'

export function AppSidebar() {
  const location = useLocation()
  const isOwner = useAuthStore((s) => s.isOwner)

  const calendarActive =
    location.pathname === '/calendar' || location.pathname.startsWith('/calendar/')
  const manageEmployeesActive = location.pathname.startsWith('/admin/dashboard')
  const cppTableActive = location.pathname === '/cpp-table'

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="Home"
              className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1! group-data-[collapsible=icon]:[&>span:last-child]:hidden"
            >
              <Link to="/calendar">
                <img src={logo} alt="Harmony" className="size-6 shrink-0" />
                <span className="truncate font-semibold text-lg">Harmony</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={calendarActive} tooltip="Calendar">
                  <Link to="/calendar">
                    <CalendarDays />
                    <span>Calendar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={cppTableActive} tooltip="Payroll Calculator">
                  <Link to="/cpp-table">
                    <TableProperties />
                    <span>Payroll Calculator</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isOwner() && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={manageEmployeesActive}
                    tooltip="Manage employees"
                  >
                    <Link to="/admin/dashboard">
                      <Users />
                      <span>Manage employees</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex-row items-center justify-start">
        <SidebarTrigger className="shrink-0" />
      </SidebarFooter>
    </Sidebar>
  )
}
