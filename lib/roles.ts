import { createClient } from "@/lib/supabase/server"
import type { UserRole, UserRoleWithDetails } from "@/lib/types"

/**
 * Check if a user has a specific role
 */
export async function userHasRole(userId: string, roleName: UserRole): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("user_has_role", {
    user_id_param: userId,
    role_name_param: roleName,
  })

  if (error) {
    console.error("Error checking user role:", error)
    return false
  }

  return data === true
}

/**
 * Check if a user has a specific role (alias for userHasRole)
 */
export async function hasRole(userId: string, roleName: UserRole): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("user_has_role", {
    user_id_param: userId,
    role_name_param: roleName,
  })

  if (error) {
    console.error("Error checking user role:", error)
    return false
  }

  return data === true
}

/**
 * Check if a user has any of the specified roles
 */
export async function userHasAnyRole(userId: string, roleNames: UserRole[]): Promise<boolean> {
  const roles = await getUserRoles(userId)
  return roles.some((role) => roleNames.includes(role.role_name))
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string): Promise<UserRoleWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_user_roles", {
    user_id_param: userId,
  })

  if (error) {
    console.error("Error fetching user roles:", error)
    return []
  }

  return data || []
}

/**
 * Assign a role to a user
 */
export async function assignRole(
  userId: string,
  roleName: UserRole,
  assignedBy: string,
  options?: {
    expiresAt?: string
    lemonSqueezyOrderId?: string
    notes?: string
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get role ID
  const { data: role, error: roleError } = await supabase.from("roles").select("id").eq("name", roleName).single()

  if (roleError || !role) {
    return { success: false, error: "Role not found" }
  }

  // Insert user role
  const { error: insertError } = await supabase.from("user_roles").insert({
    user_id: userId,
    role_id: role.id,
    assigned_by: assignedBy,
    expires_at: options?.expiresAt || null,
    lemon_squeezy_order_id: options?.lemonSqueezyOrderId || null,
    notes: options?.notes || null,
  })

  if (insertError) {
    // Check if it's a duplicate
    if (insertError.code === "23505") {
      return { success: false, error: "User already has this role" }
    }
    return { success: false, error: insertError.message }
  }

  // Log the assignment
  await supabase.from("role_audit_log").insert({
    user_id: userId,
    role_name: roleName,
    action: "assigned",
    performed_by: assignedBy,
    metadata: options,
  })

  return { success: true }
}

/**
 * Remove a role from a user
 */
export async function removeRole(
  userId: string,
  roleName: UserRole,
  removedBy: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get role ID
  const { data: role, error: roleError } = await supabase.from("roles").select("id").eq("name", roleName).single()

  if (roleError || !role) {
    return { success: false, error: "Role not found" }
  }

  // Delete user role
  const { error: deleteError } = await supabase.from("user_roles").delete().match({
    user_id: userId,
    role_id: role.id,
  })

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  // Log the removal
  await supabase.from("role_audit_log").insert({
    user_id: userId,
    role_name: roleName,
    action: "removed",
    performed_by: removedBy,
    reason: reason,
  })

  return { success: true }
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  return await userHasRole(user.id, "admin")
}

/**
 * Get current user's roles
 */
export async function getCurrentUserRoles(): Promise<UserRoleWithDetails[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  return await getUserRoles(user.id)
}
