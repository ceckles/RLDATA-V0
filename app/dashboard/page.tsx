import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { RecentSessions } from "@/components/recent-sessions"
import { Box, Target, TrendingUp, Wrench, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { TIER_LIMITS } from "@/lib/tier-limits"
import { Badge } from "@/components/ui/badge"
import type { MaintenanceSchedule } from "@/lib/types"
import { logger } from "@/lib/logger"

function getMaintenanceStatus(
  schedule: MaintenanceSchedule,
  roundCount: number,
): { status: "ok" | "due-soon" | "overdue"; message: string } {
  if (!schedule.last_completed_at && !schedule.last_completed_round_count) {
    return { status: "ok", message: "Not yet completed" }
  }

  if (schedule.interval_type === "rounds") {
    const roundsSinceLastMaintenance = roundCount - (schedule.last_completed_round_count || 0)
    const roundsUntilDue = schedule.interval_value - roundsSinceLastMaintenance

    if (roundsUntilDue <= 0) {
      return { status: "overdue", message: `Overdue by ${Math.abs(roundsUntilDue)} rounds` }
    }
    if (roundsUntilDue <= schedule.interval_value * 0.2) {
      return { status: "due-soon", message: `Due in ${roundsUntilDue} rounds` }
    }
    return { status: "ok", message: `Due in ${roundsUntilDue} rounds` }
  }

  if (schedule.interval_type === "days" && schedule.last_completed_at) {
    const daysSinceLastMaintenance = Math.floor(
      (Date.now() - new Date(schedule.last_completed_at).getTime()) / (1000 * 60 * 60 * 24),
    )
    const daysUntilDue = schedule.interval_value - daysSinceLastMaintenance

    if (daysUntilDue <= 0) {
      return { status: "overdue", message: `Overdue by ${Math.abs(daysUntilDue)} days` }
    }
    if (daysUntilDue <= schedule.interval_value * 0.2) {
      return { status: "due-soon", message: `Due in ${daysUntilDue} days` }
    }
    return { status: "ok", message: `Due in ${daysUntilDue} days` }
  }

  return { status: "ok", message: "On schedule" }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    await logger.warn("auth", "Unauthorized dashboard access attempt")
    return null
  }

  await logger.logWithUser(user.id, "info", "user_action", "Dashboard page viewed")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const tier = (profile?.subscription_tier as "basic" | "premium") || "basic"
  const isBasic = tier === "basic"

  const [
    { count: componentsCount },
    { count: firearmsCount },
    { count: sessionsCount },
    { data: sessions },
    { data: components },
    { data: firearms },
  ] = await Promise.all([
    supabase.from("components").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("firearms").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("shooting_sessions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("shooting_sessions")
      .select("*, firearms(*), shot_data(*)")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(10),
    supabase.from("components").select("*").eq("user_id", user.id),
    supabase.from("firearms").select("*, maintenance_schedules(*)").eq("user_id", user.id),
  ])

  const firearmsWithMaintenance =
    firearms?.map((firearm) => {
      const schedules = (firearm.maintenance_schedules || []) as MaintenanceSchedule[]
      const overdueSchedules = schedules.filter((schedule) => {
        const status = getMaintenanceStatus(schedule, firearm.round_count)
        return status.status === "overdue"
      })
      const dueSoonSchedules = schedules.filter((schedule) => {
        const status = getMaintenanceStatus(schedule, firearm.round_count)
        return status.status === "due-soon"
      })
      return {
        ...firearm,
        schedules,
        overdueSchedules,
        dueSoonSchedules,
      }
    }) || []

  const firearmsNeedingMaintenance = firearmsWithMaintenance.filter(
    (f) => f.overdueSchedules.length > 0 || f.dueSoonSchedules.length > 0,
  )

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

      {firearmsNeedingMaintenance.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
              <AlertTriangle className="h-5 w-5" />
              Maintenance Alerts
            </CardTitle>
            <CardDescription className="text-yellow-800 dark:text-yellow-200">
              {firearmsNeedingMaintenance.length} firearm{firearmsNeedingMaintenance.length > 1 ? "s" : ""} need
              attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {firearmsNeedingMaintenance.map((firearm) => (
              <Link key={firearm.id} href="/dashboard/firearms">
                <div className="rounded-lg border border-yellow-300 dark:border-yellow-800 bg-white dark:bg-background p-3 hover:bg-yellow-100 dark:hover:bg-yellow-950/40 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{firearm.name}</p>
                        {firearm.overdueSchedules.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {firearm.overdueSchedules.length} overdue
                          </Badge>
                        )}
                        {firearm.dueSoonSchedules.length > 0 && (
                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                            {firearm.dueSoonSchedules.length} due soon
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {firearm.caliber} • {firearm.round_count.toLocaleString()} rounds
                      </p>
                      <div className="mt-2 space-y-1">
                        {firearm.overdueSchedules.map((schedule) => {
                          const status = getMaintenanceStatus(schedule, firearm.round_count)
                          return (
                            <p key={schedule.id} className="text-sm text-red-700 dark:text-red-400">
                              • {schedule.name}: {status.message}
                            </p>
                          )
                        })}
                        {firearm.dueSoonSchedules.map((schedule) => {
                          const status = getMaintenanceStatus(schedule, firearm.round_count)
                          return (
                            <p key={schedule.id} className="text-sm text-yellow-700 dark:text-yellow-400">
                              • {schedule.name}: {status.message}
                            </p>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Get access to performance trends, velocity analysis, environmental impact charts, and firearm
                  comparisons
                </p>
              </div>
              <Link href="/dashboard/settings">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 whitespace-nowrap">
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
