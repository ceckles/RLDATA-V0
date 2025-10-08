"use client"

import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { UserPlus, UserMinus, Shield } from "lucide-react"

interface AuditLog {
  id: string
  user_id: string
  role_id: string
  action: string
  performed_by: string
  performed_at: string
  metadata: any
  roles: {
    name: string
    display_name: string
  } | null
  profiles: {
    email: string
    full_name: string | null
  } | null
  admin: {
    email: string
    full_name: string | null
  } | null
}

interface AdminAuditLogProps {
  logs: AuditLog[]
}

export function AdminAuditLog({ logs }: AdminAuditLogProps) {
  return (
    <div className="space-y-3">
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No audit logs yet</p>
      ) : (
        logs.map((log) => {
          const isAssignment = log.action === "assigned"
          const Icon = isAssignment ? UserPlus : UserMinus

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
            >
              <div
                className={`rounded-full p-2 ${isAssignment ? "bg-green-100 dark:bg-green-950" : "bg-red-100 dark:bg-red-950"}`}
              >
                <Icon
                  className={`h-4 w-4 ${isAssignment ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">
                    {log.profiles?.full_name || log.profiles?.email || "Unknown user"}
                  </span>
                  <Badge variant={isAssignment ? "default" : "outline"}>{isAssignment ? "Assigned" : "Removed"}</Badge>
                  <Badge variant="secondary">
                    <Shield className="h-3 w-3 mr-1" />
                    {log.roles?.display_name || "Unknown role"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  By {log.admin?.full_name || log.admin?.email || "System"} •{" "}
                  {formatDistanceToNow(new Date(log.performed_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
