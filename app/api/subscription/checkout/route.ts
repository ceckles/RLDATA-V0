import { createClient } from "@/lib/supabase/server"
import { createCheckoutUrl } from "@/lib/lemon-squeezy"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const planType = body.planType || "monthly"

    console.log("[v0] Checkout - Request body:", body)
    console.log("[v0] Checkout - Plan type:", planType)

    if (planType !== "monthly" && planType !== "annual") {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Checkout - User ID:", user.id)
    console.log("[v0] Checkout - User email:", user.email)

    let { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    console.log("[v0] Checkout - Profile query result:", { profile, profileError })

    if (!profile) {
      console.log("[v0] Checkout - Creating new profile for user:", user.id)

      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
          subscription_tier: "basic",
        })
        .select()
        .single()

      if (createError) {
        console.error("[v0] Checkout - Failed to create profile:", createError)
        console.error("[v0] Checkout - Error details:", JSON.stringify(createError, null, 2))
        return NextResponse.json(
          {
            error: "Failed to create profile",
            details: createError.message,
            hint: createError.hint,
          },
          { status: 500 },
        )
      }

      console.log("[v0] Checkout - Profile created successfully:", newProfile)
      profile = newProfile
    }

    if (profile.subscription_tier === "premium") {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 })
    }

    console.log("[v0] Checkout - Environment check:")
    console.log("[v0] Checkout - LEMON_SQUEEZY_STORE_ID:", process.env.LEMON_SQUEEZY_STORE_ID)
    console.log("[v0] Checkout - LEMON_SQUEEZY_MONTHLY_VARIANT_ID:", process.env.LEMON_SQUEEZY_MONTHLY_VARIANT_ID)
    console.log("[v0] Checkout - LEMON_SQUEEZY_ANNUAL_VARIANT_ID:", process.env.LEMON_SQUEEZY_ANNUAL_VARIANT_ID)
    console.log("[v0] Checkout - Selected plan type:", planType)

    console.log("[v0] Checkout - Calling createCheckoutUrl...")
    const checkoutUrl = await createCheckoutUrl(profile.email, user.id, planType)
    console.log("[v0] Checkout - Checkout URL created successfully:", checkoutUrl)

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error("[v0] Checkout error:", error)
    return NextResponse.json(
      {
        error: "Failed to create checkout",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
