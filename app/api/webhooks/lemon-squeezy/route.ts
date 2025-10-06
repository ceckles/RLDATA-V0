import { LEMON_SQUEEZY_CONFIG } from "@/lib/lemon-squeezy"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"

function verifySignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac("sha256", LEMON_SQUEEZY_CONFIG.webhookSecret)
  const digest = hmac.update(payload).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export async function POST(request: Request) {
  try {
    console.log("[v0] Webhook received: POST /api/webhooks/lemon-squeezy")
    const payload = await request.text()

    await fetch(`${request.headers.get("origin")}/api/debug/last-webhook`, {
      method: "POST",
      body: payload,
    }).catch(() => {})

    console.log("[v0] Webhook payload length:", payload.length)

    const signature = request.headers.get("x-signature")

    console.log("[v0] Webhook signature present:", !!signature)

    const event = JSON.parse(payload)
    const supabase = createAdminClient()

    const eventName = event.meta?.event_name
    const customData = event.meta?.custom_data
    const userId = customData?.user_id

    console.log("[v0] Webhook event:", eventName)
    console.log("[v0] Webhook custom_data:", JSON.stringify(customData))
    console.log("[v0] Webhook user_id:", userId)
    console.log("[v0] Full event meta:", JSON.stringify(event.meta))

    if (!userId) {
      console.error("[v0] No user_id in webhook payload")
      return NextResponse.json({ error: "No user_id in custom_data" }, { status: 400 })
    }

    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        const subscription = event.data.attributes
        console.log("[v0] Subscription data:", JSON.stringify(subscription))

        if (userId) {
          console.log("[v0] Updating profile to premium for user:", userId)
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
            console.error("[v0] Failed to update profile:", error)
            return NextResponse.json({ error: "Failed to update profile", details: error.message }, { status: 500 })
          } else {
            console.log("[v0] Profile updated successfully:", data)
          }
        } else {
          console.error("[v0] Cannot update profile - no user_id")
        }
        break
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        const subscription = event.data.attributes
        console.log("[v0] Downgrading profile to basic for user:", userId)
        if (userId) {
          await supabase
            .from("profiles")
            .update({
              subscription_tier: "basic",
              subscription_status: subscription?.status || "cancelled",
              subscription_ends_at: subscription?.ends_at || null,
            })
            .eq("id", userId)
        }
        break
      }

      case "subscription_resumed": {
        const subscription = event.data.attributes
        console.log("[v0] Resuming premium for user:", userId)
        if (userId) {
          await supabase
            .from("profiles")
            .update({
              subscription_tier: "premium",
              subscription_status: "active",
              subscription_ends_at: subscription?.ends_at || null,
            })
            .eq("id", userId)
        }
        break
      }

      case "subscription_paused": {
        console.log("[v0] Pausing subscription for user:", userId)
        if (userId) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "paused",
            })
            .eq("id", userId)
        }
        break
      }

      default:
        console.log(`[v0] Unhandled event: ${eventName}`)
    }

    return NextResponse.json({ received: true, event: eventName, userId })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed", details: String(error) }, { status: 500 })
  }
}
