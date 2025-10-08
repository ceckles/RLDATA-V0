import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { userHasRole, userHasAnyRole, isAdmin } from "@/lib/roles"
import type { UserRole } from "@/lib/types"

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}

/**
 * Require specific role - redirect to unauthorized page if user doesn't have role
 */
export async function requireRole(roleName: UserRole) {
  const user = await requireAuth()
  const hasRole = await userHasRole(user.id, roleName)

  if (!hasRole) {
    redirect("/unauthorized")
  }

  return user
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(roleNames: UserRole[]) {
  const user = await requireAuth()
  const hasAnyRole = await userHasAnyRole(user.id, roleNames)

  if (!hasAnyRole) {
    redirect("/unauthorized")
  }

  return user
}

/**
 * Require admin role
 */
export async function requireAdmin() {
  return await requireRole("admin")
}

/**
 * Check if user has role (returns boolean, doesn't redirect)
 */
export async function checkRole(roleName: UserRole): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  return await userHasRole(user.id, roleName)
}

/**
 * Check if user is admin (returns boolean, doesn't redirect)
 */
export async function checkAdmin(): Promise<boolean> {
  return await isAdmin()
}
