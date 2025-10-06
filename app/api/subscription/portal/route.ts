import { createClient } from "@/lib/supabase/server"
import { getCustomerPortalUrl } from "@/lib/lemon-squeezy"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile || !profile.lemon_squeezy_customer_id) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 })
    }

    const portalUrl = await getCustomerPortalUrl(profile.lemon_squeezy_customer_id)

    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    console.error("Portal error:", error)
    return NextResponse.json({ error: "Failed to get portal URL" }, { status: 500 })
  }
}
