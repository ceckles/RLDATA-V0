import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { data: comments, error } = await supabase
      .from("bug_report_comments")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq("bug_report_id", params.id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching comments:", error)
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }

    return NextResponse.json({ comments }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in comments fetch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { comment } = body

    if (!comment) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("bug_report_comments")
      .insert({
        bug_report_id: params.id,
        user_id: user.id,
        comment,
      })
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error("[v0] Error adding comment:", error)
      return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
    }

    return NextResponse.json({ success: true, comment: data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in comment creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
