import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { RecentSessions } from "@/components/recent-sessions"
import { Box, Target, TrendingUp, Wrench } from "lucide-react"
import Link from "next/link"
import { TIER_LIMITS } from "@/lib/tier-limits"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const tier = (profile?.subscription_tier as "basic" | "premium") || "basic"
  const isBasic = tier === "basic"

  const [
    { count: componentsCount },
    { count: firearmsCount },
    { count: sessionsCount },
    { data: sessions },
    { data: components },
  ] = await Promise.all([
    supabase.from("components").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("firearms").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("shooting_sessions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("shooting_sessions")
      .select("*, firearms(*)")
      .eq("user_id", user.id)
      .order("session_date", { ascending: false })
      .limit(5),
    supabase.from("components").select("*").eq("user_id", user.id),
  ])

  const componentsByType =
    components?.reduce(
      (acc, component) => {
        acc[component.type] = (acc[component.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  const totalRounds = sessions?.reduce((sum, session) => sum + (session.rounds_fired || 0), 0) || 0

  const inventoryValue =
    components?.reduce((sum, component) => {
      const value = (component.cost_per_unit || 0) * component.quantity
      return sum + value
    }, 0) || 0

  const stats = [
    {
      title: "Components",
      value: componentsCount || 0,
      description: isBasic
        ? `${componentsCount || 0}/${TIER_LIMITS[tier].totalComponents} total`
        : "Total inventory items",
      icon: Box,
      href: "/dashboard/inventory",
      showLimit: isBasic,
      limit: TIER_LIMITS[tier].totalComponents,
    },
    {
      title: "Firearms",
      value: firearmsCount || 0,
      description: isBasic ? `${firearmsCount || 0}/${TIER_LIMITS[tier].firearms} registered` : "Registered firearms",
      icon: Target,
      href: "/dashboard/firearms",
      showLimit: isBasic,
      limit: TIER_LIMITS[tier].firearms,
    },
    {
      title: "Sessions",
      value: sessionsCount || 0,
      description: isBasic ? `${sessionsCount || 0}/${TIER_LIMITS[tier].sessions} logged` : "Shooting sessions logged",
      icon: Wrench,
      href: "/dashboard/sessions",
      showLimit: isBasic,
      limit: TIER_LIMITS[tier].sessions,
    },
    {
      title: "Total Rounds",
      value: totalRounds.toLocaleString(),
      description: "Rounds fired across all sessions",
      icon: TrendingUp,
      href: "/dashboard/sessions",
      showLimit: false,
    },
  ]

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to ReloadData</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const percentage = stat.showLimit && stat.limit ? (stat.value / stat.limit) * 100 : 0
          const isNearLimit = percentage >= 80

          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer relative overflow-hidden">
                {stat.showLimit && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                    <div
                      className={`h-full transition-all ${isNearLimit ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                )}
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                  {stat.showLimit && isNearLimit && (
                    <p className="text-xs text-destructive mt-1">Near limit - Upgrade for unlimited</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {profile?.subscription_tier === "premium" && sessions && sessions.length > 0 && (
        <AnalyticsCharts sessions={sessions} />
      )}

      {profile?.subscription_tier === "basic" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Advanced Analytics
            </CardTitle>
            <CardDescription>Upgrade to Premium to unlock detailed performance insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Get access to performance trends, group size analysis, and environmental impact charts
                </p>
              </div>
              <Link href="/dashboard/settings">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  Upgrade Now
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <RecentSessions sessions={sessions || []} />

        <Card>
          <CardHeader>
            <CardTitle>Inventory Summary</CardTitle>
            <CardDescription>Component breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {components && components.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Primers</p>
                    <p className="text-2xl font-bold">
                      {components.filter((c) => c.type === "primer").reduce((sum, c) => sum + c.quantity, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bullets</p>
                    <p className="text-2xl font-bold">
                      {components.filter((c) => c.type === "bullet").reduce((sum, c) => sum + c.quantity, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Brass</p>
                    <p className="text-2xl font-bold">
                      {components.filter((c) => c.type === "brass").reduce((sum, c) => sum + c.quantity, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Powder (lbs)</p>
                    <p className="text-2xl font-bold">{components.filter((c) => c.type === "powder").length}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                  <p className="text-2xl font-bold">${inventoryValue.toFixed(2)}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No components in inventory yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Link href="/dashboard/inventory">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Add Components</CardTitle>
                <CardDescription>Track primers, powder, bullets, and brass</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/firearms">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Register Firearm</CardTitle>
                <CardDescription>Add a new firearm to your collection</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/sessions">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Log Session</CardTitle>
                <CardDescription>Record your latest range trip</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/inventory">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Manage Inventory</CardTitle>
                <CardDescription>Update component quantities</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
