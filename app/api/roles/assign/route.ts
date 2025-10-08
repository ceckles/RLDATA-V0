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
    const { userId, roleName, expiresAt, notes } = body

    if (!userId || !roleName) {
      return NextResponse.json({ error: "Missing required fields: userId, roleName" }, { status: 400 })
    }

    // Validate role name
    const validRoles: UserRole[] = ["admin", "moderator", "subscriber", "donator", "tester"]
    if (!validRoles.includes(roleName)) {
      return NextResponse.json({ error: "Invalid role name" }, { status: 400 })
    }

    const result = await assignRole(userId, roleName, user.id, {
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
