import { createClient } from "@/lib/supabase/server"
import { createCheckoutUrl } from "@/lib/lemon-squeezy"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const planType = body.planType || "monthly"

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

    let { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile) {
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
        return NextResponse.json(
          {
            error: "Failed to create profile",
            details: createError.message,
            hint: createError.hint,
          },
          { status: 500 },
        )
      }

      profile = newProfile
    }

    if (profile.subscription_tier === "premium") {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 })
    }

    const checkoutUrl = await createCheckoutUrl(profile.email, user.id, planType)

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create checkout",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
