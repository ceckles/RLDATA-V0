import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Manual upgrade - User ID:", user.id)

    // Update profile to premium
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_tier: "premium",
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("[v0] Manual upgrade - Update error:", updateError)
      return NextResponse.json({ error: "Failed to upgrade profile" }, { status: 500 })
    }

    console.log("[v0] Manual upgrade - Success!")

    return NextResponse.json({
      success: true,
      message: "Profile upgraded to premium",
    })
  } catch (error) {
    console.error("[v0] Manual upgrade - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
