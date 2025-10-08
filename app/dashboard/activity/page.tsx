import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Target, File as Rifle, Box, Zap } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

interface DataActivity {
  id: string
  type: "session" | "firearm" | "component" | "recipe"
  action: string
  description: string
  created_at: string
  link?: string
}

function getActivityIcon(type: string) {
  switch (type) {
    case "session":
      return Target
    case "firearm":
      return Rifle
    case "component":
      return Box
    case "recipe":
      return Zap
    default:
      return Activity
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case "session":
      return "bg-blue-500/10 text-blue-500"
    case "firearm":
      return "bg-orange-500/10 text-orange-500"
    case "component":
      return "bg-green-500/10 text-green-500"
    case "recipe":
      return "bg-purple-500/10 text-purple-500"
    default:
      return "bg-gray-500/10 text-gray-500"
  }
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export default async function ActivityPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [{ data: recentSessions }, { data: recentFirearms }, { data: recentComponents }, { data: recentRecipes }] =
    await Promise.all([
      supabase
        .from("shooting_sessions")
        .select("id, date, rounds_fired, created_at, firearms(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("firearms")
        .select("id, name, caliber, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("components")
        .select("id, type, manufacturer, model, quantity, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("load_recipes")
        .select("id, name, caliber, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ])

  const allActivities: DataActivity[] = [
    ...(recentSessions?.map((session) => ({
      id: session.id,
      type: "session" as const,
      action: "Logged shooting session",
      description: `${session.rounds_fired} rounds with ${session.firearms?.name || "Unknown firearm"}`,
      created_at: session.created_at,
      link: "/dashboard/shooting",
    })) || []),
    ...(recentFirearms?.map((firearm) => ({
      id: firearm.id,
      type: "firearm" as const,
      action: "Added firearm",
      description: `${firearm.name} (${firearm.caliber})`,
      created_at: firearm.created_at,
      link: "/dashboard/firearms",
    })) || []),
    ...(recentComponents?.map((component) => ({
      id: component.id,
      type: "component" as const,
      action: `Added ${component.type}`,
      description: `${component.manufacturer} ${component.model} (${component.quantity} units)`,
      created_at: component.created_at,
      link: "/dashboard/inventory",
    })) || []),
    ...(recentRecipes?.map((recipe) => ({
      id: recipe.id,
      type: "recipe" as const,
      action: "Created load recipe",
      description: `${recipe.name} for ${recipe.caliber}`,
      created_at: recipe.created_at,
      link: "/dashboard/reloading",
    })) || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">Complete history of your reloading data activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            All Activity
          </CardTitle>
          <CardDescription>
            Showing {allActivities.length} recent {allActivities.length === 1 ? "activity" : "activities"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allActivities.length > 0 ? (
            <div className="space-y-4">
              {allActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                const colorClass = getActivityColor(activity.type)

                const content = (
                  <div key={activity.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <div className={`mt-0.5 p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.created_at)}</span>
                    </div>
                  </div>
                )

                return activity.link ? (
                  <Link
                    key={activity.id}
                    href={activity.link}
                    className="block hover:bg-muted/50 rounded-lg -mx-2 px-2 transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={activity.id}>{content}</div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No activity yet. Start by adding a firearm or logging a session!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
