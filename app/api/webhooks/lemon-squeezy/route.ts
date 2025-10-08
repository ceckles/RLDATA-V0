import { LEMON_SQUEEZY_CONFIG } from "@/lib/lemon-squeezy"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { assignRole, removeRole, userHasRole } from "@/lib/roles"

function verifySignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac("sha256", LEMON_SQUEEZY_CONFIG.webhookSecret)
  const digest = hmac.update(payload).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export async function POST(request: Request) {
  try {
    const payload = await request.text()
    const signature = request.headers.get("x-signature")
    const event = JSON.parse(payload)
    const supabase = createAdminClient()

    const eventName = event.meta?.event_name
    const customData = event.meta?.custom_data
    const userId = customData?.user_id

    if (!userId) {
      console.error("No user_id in webhook payload")
      return NextResponse.json({ error: "No user_id in custom_data" }, { status: 400 })
    }

    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        const subscription = event.data.attributes

        if (userId) {
          // Update profile
          const { data, error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: "premium",
              subscription_status: subscription?.status || "active",
              lemon_squeezy_customer_id: subscription?.customer_id?.toString() || null,
              lemon_squeezy_subscription_id: event.data.id || null,
              subscription_ends_at: subscription?.ends_at || null,
            })
            .eq("id", userId)
            .select()

          if (error) {
            console.error("Failed to update profile:", error)
            return NextResponse.json({ error: "Failed to update profile", details: error.message }, { status: 500 })
          }

          const hasSubscriberRole = await userHasRole(userId, "subscriber")
          if (!hasSubscriberRole && subscription?.status === "active") {
            await assignRole(userId, "subscriber", userId, {
              notes: `Auto-assigned via ${eventName}`,
            })
          }
        } else {
          console.error("Cannot update profile - no user_id")
        }
        break
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        const subscription = event.data.attributes
        if (userId) {
          // Update profile
          await supabase
            .from("profiles")
            .update({
              subscription_tier: "basic",
              subscription_status: subscription?.status || "cancelled",
              subscription_ends_at: subscription?.ends_at || null,
            })
            .eq("id", userId)

          const hasSubscriberRole = await userHasRole(userId, "subscriber")
          if (hasSubscriberRole) {
            await removeRole(userId, "subscriber", userId, `Subscription ${eventName}`)
          }
        }
        break
      }

      case "subscription_resumed": {
        const subscription = event.data.attributes
        if (userId) {
          // Update profile
          await supabase
            .from("profiles")
            .update({
              subscription_tier: "premium",
              subscription_status: "active",
              subscription_ends_at: subscription?.ends_at || null,
            })
            .eq("id", userId)

          const hasSubscriberRole = await userHasRole(userId, "subscriber")
          if (!hasSubscriberRole) {
            await assignRole(userId, "subscriber", userId, {
              notes: "Auto-assigned via subscription_resumed",
            })
          }
        }
        break
      }

      case "subscription_paused": {
        if (userId) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "paused",
            })
            .eq("id", userId)

          const hasSubscriberRole = await userHasRole(userId, "subscriber")
          if (hasSubscriberRole) {
            await removeRole(userId, "subscriber", userId, "Subscription paused")
          }
        }
        break
      }

      case "subscription_payment_failed": {
        if (userId) {
          // Log the payment failure but don't immediately remove role
          // Give grace period for payment retry
          console.log(`Payment failed for user ${userId}`)
        }
        break
      }

      case "order_created": {
        const order = event.data.attributes
        const orderType = customData?.order_type // 'donation' or 'subscription'

        if (userId && orderType === "donation") {
          // Update profile with order ID
          await supabase
            .from("profiles")
            .update({
              lemon_squeezy_order_id: event.data.id,
            })
            .eq("id", userId)

          // Assign donator role
          const hasDonatorRole = await userHasRole(userId, "donator")
          if (!hasDonatorRole) {
            await assignRole(userId, "donator", userId, {
              lemonSqueezyOrderId: event.data.id,
              notes: `Donation of ${order.total_formatted || "unknown amount"}`,
            })
          }
        }
        break
      }

      case "order_refunded": {
        const orderType = customData?.order_type

        if (userId && orderType === "donation") {
          // Remove donator role if refunded
          const hasDonatorRole = await userHasRole(userId, "donator")
          if (hasDonatorRole) {
            await removeRole(userId, "donator", userId, "Donation refunded")
          }
        }
        break
      }

      default:
        console.log(`Unhandled event: ${eventName}`)
    }

    return NextResponse.json({ received: true, event: eventName, userId })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed", details: String(error) }, { status: 500 })
  }
}
