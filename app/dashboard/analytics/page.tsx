import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnalyticsContent } from "@/components/analytics-content"
import { logger } from "@/lib/logger"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    await logger.warn("auth", "Unauthorized analytics page access attempt")
    redirect("/auth/login")
  }

  await logger.logWithUser(user.id, "info", "analytics", "Analytics page viewed")

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

  if (sessionsError) {
    await logger.logWithUser(
      user.id,
      "error",
      "database",
      "Failed to fetch shooting sessions for analytics",
      { errorMessage: sessionsError.message },
      sessionsError as Error,
    )
  }

  return <AnalyticsContent profile={profile} sessions={sessions || []} />
}
