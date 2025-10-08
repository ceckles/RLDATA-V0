import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createCheckoutUrl } from "@/lib/lemon-squeezy"

export async function POST(request: Request) {
  try {
    const { variantId } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get or create profile
    let { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (profileError || !profile) {
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
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
      }

      profile = newProfile
    }

    const planType = variantId === process.env.LEMON_SQUEEZY_ANNUAL_VARIANT_ID ? "annual" : "monthly"
    const checkoutUrl = await createCheckoutUrl(user.email!, user.id, planType)

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
  }
}
