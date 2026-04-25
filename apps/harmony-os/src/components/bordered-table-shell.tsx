import { cn } from '@harmony/ui/lib/utils'

type BorderedTableShellProps = {
  children: React.ReactNode
  /** Optional strip above the scroll area (e.g. employee name on day detail). */
  topBar?: React.ReactNode
  className?: string
}

/**
 * Shared table chrome: rounded border + scroll region, matching Time entries and Manage employees.
 */
export function BorderedTableShell({ children, topBar, className }: BorderedTableShellProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border',
        className,
      )}
    >
      {topBar ? (
        <div className="shrink-0 border-b border-border px-4 py-2.5 text-sm text-muted-foreground">
          {topBar}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
    </div>
  )
}
