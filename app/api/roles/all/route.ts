import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/roles"

/**
 * GET /api/roles/all - Get all available roles
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

    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: roles, error } = await supabase.from("roles").select("*").order("name")

    if (error) {
      throw error
    }

    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Error fetching all roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}
