import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

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
      await logger.warn("Unauthorized role update attempt", {
        category: "admin",
        userId: user.id,
      })
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { userId, role } = await request.json()

    if (!userId || !role || !["user", "moderator", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Update user role
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)

    if (error) {
      await logger.error("Failed to update user role", {
        category: "admin",
        userId: user.id,
        metadata: { targetUserId: userId, newRole: role, error: error.message },
      })
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
    }

    await logger.info(`User role updated to ${role}`, {
      category: "admin",
      userId: user.id,
      metadata: { targetUserId: userId, newRole: role },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    await logger.error("Error in update-role API", {
      category: "admin",
      metadata: { error: error instanceof Error ? error.message : "Unknown error" },
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
