import { createClient } from "@/lib/supabase/server"
import { SessionsList } from "@/components/sessions-list"
import { AddSessionDialog } from "@/components/add-session-dialog"
import { Target, Crown } from "lucide-react"
import { PremiumAnalytics } from "@/components/premium-analytics"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
      .select("*, firearms(*), ammunition_batches(*), shot_data(*)")
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

  const isPremium = profile?.subscription_tier === "premium"

  return (
    <div className="container mx-auto max-w-7xl py-4 sm:py-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 sm:h-8 sm:w-8" />
            Shooting Sessions
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track your range trips and performance data</p>
        </div>
        <AddSessionDialog
          userId={user.id}
          tier={profile?.subscription_tier || "basic"}
          currentCount={sessions?.length || 0}
          firearms={firearms || []}
          ammunitionBatches={ammunitionBatches || []}
        />
      </div>

      {/* Premium Analytics Section */}
      {isPremium && sessions && sessions.length > 0 && (
        <div className="space-y-4">
          <PremiumAnalytics sessions={sessions} />
        </div>
      )}

      {/* Upgrade CTA for Basic Users */}
      {!isPremium && sessions && sessions.length > 0 && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Unlock Premium Analytics
            </CardTitle>
            <CardDescription>
              Get advanced performance insights, velocity tracking, environmental analysis, and detailed trends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-1">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Accuracy Trends</p>
                  <p className="text-xs text-muted-foreground">Track group size improvements over time</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-1">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Velocity Analysis</p>
                  <p className="text-xs text-muted-foreground">Monitor consistency with SD and ES tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-1">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Environmental Impact</p>
                  <p className="text-xs text-muted-foreground">See how weather affects your shooting</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-1">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Firearm Comparison</p>
                  <p className="text-xs text-muted-foreground">Compare performance across your collection</p>
                </div>
              </div>
            </div>
            <Link href="/dashboard/settings">
              <Button className="w-full sm:w-auto">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <SessionsList sessions={sessions || []} />
    </div>
  )
}
