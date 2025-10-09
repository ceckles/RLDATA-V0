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

async function logWebhookEvent(
  supabase: any,
  eventName: string,
  eventType: string,
  payload: any,
  status: "success" | "failed" | "pending",
  userId: string | null,
  errorMessage: string | null = null,
  processingTimeMs: number | null = null,
) {
  try {
    await supabase.from("webhook_logs").insert({
      event_name: eventName,
      event_type: eventType,
      payload,
      status,
      error_message: errorMessage,
      processing_time_ms: processingTimeMs,
      user_id: userId,
    })
  } catch (error) {
    console.error("Failed to log webhook event:", error)
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  let eventName = "unknown"
  let userId: string | null = null

  try {
    const payload = await request.text()
    const signature = request.headers.get("x-signature")
    const event = JSON.parse(payload)
    const supabase = createAdminClient()

    eventName = event.meta?.event_name || "unknown"
    const customData = event.meta?.custom_data
    userId = customData?.user_id || null

    await logWebhookEvent(supabase, eventName, "lemon_squeezy", event, "pending", userId)

    if (!userId) {
      console.error("No user_id in webhook payload")
      const processingTime = Date.now() - startTime
      await logWebhookEvent(
        supabase,
        eventName,
        "lemon_squeezy",
        event,
        "failed",
        null,
        "No user_id in custom_data",
        processingTime,
      )
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
              lemon_squeezy_order_id: subscription?.order_id?.toString() || null,
              subscription_ends_at: subscription?.ends_at || null,
            })
            .eq("id", userId)
            .select()

          if (error) {
            console.error("Failed to update profile:", error)
            const processingTime = Date.now() - startTime
            await logWebhookEvent(
              supabase,
              eventName,
              "lemon_squeezy",
              event,
              "failed",
              userId,
              `Failed to update profile: ${error.message}`,
              processingTime,
            )
            return NextResponse.json({ error: "Failed to update profile", details: error.message }, { status: 500 })
          }

          const hasSubscriberRole = await userHasRole(userId, "subscriber")
          if (!hasSubscriberRole && subscription?.status === "active") {
            await assignRole(userId, "subscriber", userId, {
              notes: `Auto-assigned via ${eventName}`,
              expiresAt: subscription?.ends_at || null,
            })
          } else if (hasSubscriberRole && subscription?.status === "active") {
            // Update existing role with new expiration date
            const { data: roleData } = await supabase.from("roles").select("id").eq("name", "subscriber").single()

            if (roleData) {
              await supabase
                .from("user_roles")
                .update({
                  expires_at: subscription?.ends_at || null,
                })
                .eq("user_id", userId)
                .eq("role_id", roleData.id)
            }
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
              expiresAt: subscription?.ends_at || null,
            })
          } else {
            // Update existing role with new expiration date
            const { data: roleData } = await supabase.from("roles").select("id").eq("name", "subscriber").single()

            if (roleData) {
              await supabase
                .from("user_roles")
                .update({
                  expires_at: subscription?.ends_at || null,
                })
                .eq("user_id", userId)
                .eq("role_id", roleData.id)
            }
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
          console.log(`Payment failed for user ${userId}`)
        }
        break
      }

      case "order_created": {
        const order = event.data.attributes
        const orderType = customData?.order_type

        if (userId && orderType === "donation") {
          await supabase
            .from("profiles")
            .update({
              lemon_squeezy_order_id: event.data.id,
            })
            .eq("id", userId)

          const hasDonatorRole = await userHasRole(userId, "donator")
          if (!hasDonatorRole) {
            await assignRole(userId, "donator", userId, {
              notes: `Donation of ${order.total_formatted || "unknown amount"}`,
            })
          }
        }
        break
      }

      case "order_refunded": {
        const orderType = customData?.order_type

        if (userId && orderType === "donation") {
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

    const processingTime = Date.now() - startTime
    await logWebhookEvent(supabase, eventName, "lemon_squeezy", event, "success", userId, null, processingTime)

    return NextResponse.json({ received: true, event: eventName, userId })
  } catch (error) {
    console.error("Webhook error:", error)

    const processingTime = Date.now() - startTime
    const supabase = createAdminClient()
    await logWebhookEvent(supabase, eventName, "lemon_squeezy", {}, "failed", userId, String(error), processingTime)

    return NextResponse.json({ error: "Webhook handler failed", details: String(error) }, { status: 500 })
  }
}
