import { createClient } from "@/lib/supabase/server"
import { SessionsList } from "@/components/sessions-list"
import { AddSessionDialog } from "@/components/add-session-dialog"
import { Target } from "lucide-react"

export default async function SessionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const [{ data: sessions }, { data: firearms }, { data: ammunitionBatches }] = await Promise.all([
    supabase
      .from("shooting_sessions")
      .select("*, firearms(*), ammunition_batches(*)")
      .eq("user_id", user.id)
      .order("date", { ascending: false }),
    supabase.from("firearms").select("*").eq("user_id", user.id).order("manufacturer"),
    supabase
      .from("ammunition_batches")
      .select("id, batch_number, caliber, quantity_remaining, ammunition_type")
      .eq("user_id", user.id)
      .gt("quantity_remaining", 0)
      .order("created_at", { ascending: false }),
  ])

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8" />
            Shooting Sessions
          </h1>
          <p className="text-muted-foreground">Track your range trips and performance data</p>
        </div>
        <AddSessionDialog
          userId={user.id}
          tier={profile?.subscription_tier || "basic"}
          currentCount={sessions?.length || 0}
          firearms={firearms || []}
          ammunitionBatches={ammunitionBatches || []}
        />
      </div>

      <SessionsList sessions={sessions || []} />
    </div>
  )
}
