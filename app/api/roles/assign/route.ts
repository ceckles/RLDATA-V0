import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { assignRole, isAdmin } from "@/lib/roles"
import type { UserRole } from "@/lib/types"

/**
 * POST /api/roles/assign - Assign a role to a user (admin only)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, roleId, roleName, expiresAt, notes } = body

    if (!userId || (!roleId && !roleName)) {
      return NextResponse.json({ error: "Missing required fields: userId and (roleId or roleName)" }, { status: 400 })
    }

    let finalRoleName = roleName
    if (roleId && !roleName) {
      const { data: roleData, error: roleError } = await supabase.from("roles").select("name").eq("id", roleId).single()

      if (roleError || !roleData) {
        return NextResponse.json({ error: "Invalid role ID" }, { status: 400 })
      }
      finalRoleName = roleData.name
    }

    const validRoles: UserRole[] = ["admin", "moderator", "subscriber", "donator", "tester", "user"]
    if (!validRoles.includes(finalRoleName)) {
      return NextResponse.json({ error: "Invalid role name" }, { status: 400 })
    }

    const result = await assignRole(userId, finalRoleName, user.id, {
      expiresAt,
      notes,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Role assigned successfully" })
  } catch (error) {
    console.error("Error assigning role:", error)
    return NextResponse.json({ error: "Failed to assign role" }, { status: 500 })
  }
}
