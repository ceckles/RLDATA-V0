import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnalyticsContent } from "@/components/analytics-content"

export default async function AnalyticsPage() {
  console.log("[v0] Analytics page loading")

  const supabase = await createClient()

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.log("[v0] Auth error in analytics page:", error.message)
      redirect("/auth/login")
    }
    user = data.user
    console.log("[v0] Analytics page - user authenticated:", !!user)
  } catch (error) {
    console.log("[v0] Exception in analytics auth check:", error)
    redirect("/auth/login")
  }

  if (!user) {
    console.log("[v0] No user, redirecting to login")
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  console.log("[v0] Profile loaded:", !!profile)

  // Fetch all shooting sessions with related data
  const { data: sessions } = await supabase
    .from("shooting_sessions")
    .select(
      `
      *,
      firearms:firearm_id (
        id,
        name,
        manufacturer,
        model,
        caliber
      ),
      load_recipes:load_recipe_id (
        id,
        name,
        caliber
      ),
      shot_data (
        id,
        shot_number,
        distance,
        group_size,
        velocity,
        poi_horizontal,
        poi_vertical,
        notes
      )
    `,
    )
    .eq("user_id", user.id)
    .order("date", { ascending: false })

  console.log("[v0] Sessions loaded:", sessions?.length || 0)

  return <AnalyticsContent profile={profile} sessions={sessions || []} />
}
