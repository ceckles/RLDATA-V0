import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserRoles, isAdmin } from "@/lib/roles"

/**
 * GET /api/roles - Get current user's roles
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roles = await getUserRoles(user.id)
    const adminStatus = isAdmin(roles)

    return NextResponse.json({ roles, isAdmin: adminStatus })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}
