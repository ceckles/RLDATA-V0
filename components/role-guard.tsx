"use client"

import type { ReactNode } from "react"
import type { UserRole } from "@/lib/types"

interface RoleGuardProps {
  children: ReactNode
  userRoles: UserRole[]
  requiredRoles: UserRole[]
  requireAll?: boolean
  fallback?: ReactNode
}

/**
 * Client-side role guard component for conditional rendering
 */
export function RoleGuard({ children, userRoles, requiredRoles, requireAll = false, fallback = null }: RoleGuardProps) {
  const hasAccess = requireAll
    ? requiredRoles.every((role) => userRoles.includes(role))
    : requiredRoles.some((role) => userRoles.includes(role))

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
