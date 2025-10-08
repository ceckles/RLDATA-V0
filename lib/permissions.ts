import type { UserRole, Profile } from "@/lib/types"

/**
 * Check if user has premium access (either through subscription or subscriber role)
 */
export function hasPremiumAccess(profile: Profile | null, roles: UserRole[]): boolean {
  if (!profile) return false

  // Check subscription tier
  if (profile.subscription_tier === "premium") return true

  // Check for subscriber role
  if (roles.includes("subscriber")) return true

  return false
}

/**
 * Check if user has admin access
 */
export function hasAdminAccess(roles: UserRole[]): boolean {
  return roles.includes("admin")
}

/**
 * Check if user has moderator access (admin or moderator role)
 */
export function hasModeratorAccess(roles: UserRole[]): boolean {
  return roles.includes("admin") || roles.includes("moderator")
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  return userRoles.some((role) => requiredRoles.includes(role))
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  return requiredRoles.every((role) => userRoles.includes(role))
}

/**
 * Get highest priority role for display purposes
 */
export function getPrimaryRole(roles: UserRole[]): UserRole | null {
  const rolePriority: UserRole[] = ["admin", "moderator", "subscriber", "donator", "tester"]

  for (const role of rolePriority) {
    if (roles.includes(role)) {
      return role
    }
  }

  return null
}
