import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnalyticsContent } from "@/components/analytics-content"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch all shooting sessions with related data
  const { data: sessions, error: sessionsError } = await supabase
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

  return <AnalyticsContent profile={profile} sessions={sessions || []} />
}
