import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createCheckoutUrl } from "@/lib/lemon-squeezy"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
  try {
    const { variantId } = await request.json()

    await logger.logWithRequest("info", "payment", "Checkout initiated", request, { variantId })

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      await logger.logWithRequest("warn", "payment", "Checkout failed: User not authenticated", request)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get or create profile
    let { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (profileError || !profile) {
      await logger.logWithUser(user.id, "info", "payment", "Creating profile for checkout", { email: user.email })

      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email!,
          subscription_tier: "basic",
        })
        .select()
        .single()

      if (insertError || !newProfile) {
        await logger.logWithUser(user.id, "error", "payment", "Failed to create profile", undefined, insertError)
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
      }

      profile = newProfile
    }

    const planType = variantId === process.env.LEMON_SQUEEZY_ANNUAL_VARIANT_ID ? "annual" : "monthly"
    const checkoutUrl = await createCheckoutUrl(user.email!, user.id, planType)

    await logger.logWithUser(user.id, "info", "payment", "Checkout URL created successfully", {
      variantId,
      planType,
      hasCheckoutUrl: !!checkoutUrl,
    })

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    await logger.logWithRequest(
      "error",
      "payment",
      "Checkout creation failed",
      request,
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    )

    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
  }
}
