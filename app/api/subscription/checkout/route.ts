import { createClient } from "@/lib/supabase/server"
import { createCheckoutUrl } from "@/lib/lemon-squeezy"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const planType = body.planType || "monthly"

    await logger.logWithRequest("info", "payment", "Subscription checkout initiated", request, { planType })

    if (planType !== "monthly" && planType !== "annual") {
      await logger.logWithRequest("warn", "payment", "Invalid plan type provided", request, { planType })
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      await logger.logWithRequest("warn", "payment", "Unauthorized checkout attempt", request)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile) {
      await logger.logWithUser(user.id, "info", "payment", "Creating profile for checkout", {
        email: user.email,
        planType,
      })

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
        await logger.logWithUser(
          user.id,
          "error",
          "payment",
          "Failed to create profile for checkout",
          {
            errorMessage: createError.message,
            errorHint: createError.hint,
          },
          createError as Error,
        )

        return NextResponse.json(
          {
            error: "Failed to create profile",
            details: createError.message,
            hint: createError.hint,
          },
          { status: 500 },
        )
      }

      await logger.logWithUser(user.id, "info", "payment", "Profile created successfully for checkout")
      profile = newProfile
    }

    if (profile.subscription_tier === "premium") {
      await logger.logWithUser(user.id, "warn", "payment", "User already has premium subscription", {
        currentTier: profile.subscription_tier,
      })
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 })
    }

    await logger.logWithUser(user.id, "info", "payment", "Creating checkout URL", {
      email: profile.email,
      planType,
    })

    const checkoutUrl = await createCheckoutUrl(profile.email, user.id, planType)

    await logger.logWithUser(user.id, "info", "payment", "Checkout URL created successfully", {
      planType,
      hasUrl: !!checkoutUrl,
    })

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    await logger.logWithRequest(
      "error",
      "payment",
      "Subscription checkout failed",
      request,
      {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      error instanceof Error ? error : new Error(String(error)),
    )

    return NextResponse.json(
      {
        error: "Failed to create checkout",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
