import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSubscription } from "@/lib/lemon-squeezy"
import { assignRole, removeRole, userHasRole } from "@/lib/roles"

/**
 * POST /api/roles/sync-subscription - Sync subscription status with roles
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Check if user has a subscription
    if (!profile.lemon_squeezy_subscription_id) {
      // No subscription, ensure subscriber role is removed
      const hasSubscriberRole = await userHasRole(user.id, "subscriber")
      if (hasSubscriberRole) {
        await removeRole(user.id, "subscriber", user.id, "No active subscription")
      }
      return NextResponse.json({ message: "No active subscription" })
    }

    // Fetch subscription from LemonSqueezy
    const subscription = await getSubscription(profile.lemon_squeezy_subscription_id)

    if (!subscription) {
      return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
    }

    const isActive = subscription.attributes.status === "active"
    const hasSubscriberRole = await userHasRole(user.id, "subscriber")

    if (isActive && !hasSubscriberRole) {
      // Add subscriber role
      await assignRole(user.id, "subscriber", user.id, {
        notes: "Auto-assigned via subscription sync",
      })
    } else if (!isActive && hasSubscriberRole) {
      // Remove subscriber role
      await removeRole(user.id, "subscriber", user.id, "Subscription no longer active")
    }

    return NextResponse.json({
      success: true,
      subscriptionStatus: subscription.attributes.status,
      hasSubscriberRole: isActive,
    })
  } catch (error) {
    console.error("Error syncing subscription:", error)
    return NextResponse.json({ error: "Failed to sync subscription" }, { status: 500 })
  }
}
