import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Default true so first paint matches <md and the mobile Sheet exists (Sidebar branch).
  const [isMobile, setIsMobile] = React.useState(true)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
