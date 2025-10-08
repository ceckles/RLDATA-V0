import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Target, File as Rifle, Box, Zap } from "lucide-react"
import Link from "next/link"

interface DataActivity {
  id: string
  type: "session" | "firearm" | "component" | "recipe"
  action: string
  description: string
  created_at: string
  link?: string
}

interface RecentActivityProps {
  activities: DataActivity[]
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

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest reloading data activities</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => {
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
            No recent activity. Start by adding a firearm or logging a session!
          </p>
        )}
      </CardContent>
    </Card>
  )
}
