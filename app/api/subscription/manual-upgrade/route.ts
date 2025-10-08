import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_tier: "premium",
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Manual upgrade - Update error:", updateError)
      return NextResponse.json({ error: "Failed to upgrade profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Profile upgraded to premium",
    })
  } catch (error) {
    console.error("Manual upgrade - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
