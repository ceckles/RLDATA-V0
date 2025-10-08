import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, LogIn, CreditCard, Box, Wrench, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface ActivityLog {
  id: string
  level: "debug" | "info" | "warn" | "error"
  category: string
  message: string
  created_at: string
}

interface RecentActivityProps {
  activities: ActivityLog[]
}

function getActivityIcon(category: string) {
  switch (category) {
    case "auth":
      return LogIn
    case "payment":
      return CreditCard
    case "user_action":
      return Activity
    case "data":
      return Box
    case "system":
      return Wrench
    default:
      return Info
  }
}

function getLevelIcon(level: string) {
  switch (level) {
    case "error":
      return AlertCircle
    case "warn":
      return AlertTriangle
    case "info":
      return CheckCircle
    case "debug":
      return Info
    default:
      return Info
  }
}

function getLevelColor(level: string) {
  switch (level) {
    case "error":
      return "text-red-500"
    case "warn":
      return "text-yellow-500"
    case "info":
      return "text-blue-500"
    case "debug":
      return "text-gray-500"
    default:
      return "text-gray-500"
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
        <CardDescription>Your latest actions and events</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => {
              const CategoryIcon = getActivityIcon(activity.category)
              const LevelIcon = getLevelIcon(activity.level)
              const levelColor = getLevelColor(activity.level)

              return (
                <div key={activity.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="mt-0.5">
                    <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{activity.message}</p>
                      <LevelIcon className={`h-3 w-3 flex-shrink-0 ${levelColor}`} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {activity.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            <Link href="/dashboard/logs" className="block text-sm text-primary hover:underline">
              View all activity →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        )}
      </CardContent>
    </Card>
  )
}
