import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if current user is admin
    const { data: currentProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!currentProfile || currentProfile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { flagId, isEnabled } = await request.json()

    if (!flagId || typeof isEnabled !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Update feature flag
    const { error } = await supabase.from("feature_flags").update({ is_enabled: isEnabled }).eq("id", flagId)

    if (error) {
      return NextResponse.json({ error: "Failed to toggle feature" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
