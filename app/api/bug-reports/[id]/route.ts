import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRoles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id)

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === "admin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !["submitted", "working", "resolved", "fixed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const { data, error } = await supabase.from("bug_reports").update({ status }).eq("id", params.id).select().single()

    if (error) {
      console.error("[v0] Error updating bug report:", error)
      return NextResponse.json({ error: "Failed to update bug report" }, { status: 500 })
    }

    return NextResponse.json({ success: true, bugReport: data }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in bug report update:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
