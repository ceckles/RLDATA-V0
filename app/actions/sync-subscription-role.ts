"use server"

import { createClient } from "@/lib/supabase/server"
import { assignRole, removeRole, userHasRole } from "@/lib/roles"

export async function syncSubscriptionRole() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  console.log("[v0] Syncing subscription role for user:", user.id)

  // Get user's profile
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profileError || !profile) {
    console.error("[v0] Error fetching profile:", profileError)
    return { success: false, error: "Could not fetch profile" }
  }

  console.log("[v0] Profile data:", {
    tier: profile.subscription_tier,
    status: profile.subscription_status,
    endsAt: profile.subscription_ends_at,
  })

  // Check if user has subscriber role
  const hasSubscriberRole = await userHasRole(user.id, "subscriber")
  console.log("[v0] User has subscriber role:", hasSubscriberRole)

  // Determine if user should have subscriber role
  const shouldHaveSubscriberRole = profile.subscription_tier === "premium" && profile.subscription_status === "active"

  console.log("[v0] Should have subscriber role:", shouldHaveSubscriberRole)

  if (shouldHaveSubscriberRole && !hasSubscriberRole) {
    // Assign subscriber role
    console.log("[v0] Assigning subscriber role...")
    const result = await assignRole(user.id, "subscriber", user.id, {
      expiresAt: profile.subscription_ends_at || undefined,
      notes: "Synced from subscription status",
    })

    if (!result.success) {
      console.error("[v0] Failed to assign subscriber role:", result.error)
      return { success: false, error: result.error }
    }

    console.log("[v0] Successfully assigned subscriber role")
    return { success: true, message: "Subscriber role added" }
  } else if (!shouldHaveSubscriberRole && hasSubscriberRole) {
    // Remove subscriber role
    console.log("[v0] Removing subscriber role...")
    const result = await removeRole(user.id, "subscriber", user.id, "Subscription no longer active")

    if (!result.success) {
      console.error("[v0] Failed to remove subscriber role:", result.error)
      return { success: false, error: result.error }
    }

    console.log("[v0] Successfully removed subscriber role")
    return { success: true, message: "Subscriber role removed" }
  }

  console.log("[v0] No changes needed")
  return { success: true, message: "Roles are already in sync" }
}
