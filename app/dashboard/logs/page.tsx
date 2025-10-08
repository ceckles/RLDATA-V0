import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Info, AlertTriangle, Bug } from "lucide-react"

export default async function LogsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch logs for the current user (last 100 entries)
  const { data: logs } = await supabase
    .from("logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4" />
      case "warn":
        return <AlertTriangle className="h-4 w-4" />
      case "info":
        return <Info className="h-4 w-4" />
      case "debug":
        return <Bug className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "destructive"
      case "warn":
        return "outline"
      case "info":
        return "secondary"
      case "debug":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "auth":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "payment":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "database":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "api":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "user_action":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
      case "analytics":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const logsByLevel = logs?.reduce(
    (acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Application Logs</h1>
        <p className="text-muted-foreground">View your application activity and debug information</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Last 100 entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logsByLevel?.error || 0}</div>
            <p className="text-xs text-muted-foreground">Critical issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logsByLevel?.warn || 0}</div>
            <p className="text-xs text-muted-foreground">Potential issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
            <Info className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logsByLevel?.info || 0}</div>
            <p className="text-xs text-muted-foreground">General activity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your application logs in chronological order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-2 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant={getLevelColor(log.level) as any} className="flex items-center gap-1">
                        {getLevelIcon(log.level)}
                        {log.level}
                      </Badge>
                      <Badge className={getCategoryColor(log.category)}>{log.category}</Badge>
                      <span className="text-sm text-muted-foreground truncate">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{log.message}</p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">View metadata</summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.stack_trace && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground text-destructive">
                        View stack trace
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto text-destructive">
                        {log.stack_trace}
                      </pre>
                    </details>
                  )}
                  {log.path && (
                    <p className="text-xs text-muted-foreground">
                      Path: <code className="bg-muted px-1 py-0.5 rounded">{log.path}</code>
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No logs found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
