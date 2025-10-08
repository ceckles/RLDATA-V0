import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserRoles, isAdmin } from "@/lib/roles"

/**
 * GET /api/roles/user/[userId] - Get roles for a specific user (admin only)
 */
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or requesting their own roles
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin && user.id !== params.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const roles = await getUserRoles(params.userId)

    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Error fetching user roles:", error)
    return NextResponse.json({ error: "Failed to fetch user roles" }, { status: 500 })
  }
}
