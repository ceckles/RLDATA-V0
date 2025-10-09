"use client"

import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { UserPlus, UserMinus, Shield, Clock } from "lucide-react"

interface AuditLog {
  id: string
  user_id: string
  role_name: string
  action: string
  performed_by: string | null
  reason?: string | null
  metadata?: any
  created_at: string
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
          const isExpired = log.action === "expired"
          const Icon = isAssignment ? UserPlus : isExpired ? Clock : UserMinus

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
            >
              <div
                className={`rounded-full p-2 ${
                  isAssignment
                    ? "bg-green-100 dark:bg-green-950"
                    : isExpired
                      ? "bg-yellow-100 dark:bg-yellow-950"
                      : "bg-red-100 dark:bg-red-950"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isAssignment
                      ? "text-green-600 dark:text-green-400"
                      : isExpired
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">User ID: {log.user_id.slice(0, 8)}...</span>
                  <Badge variant={isAssignment ? "default" : isExpired ? "secondary" : "outline"}>
                    {isAssignment ? "Assigned" : isExpired ? "Expired" : "Removed"}
                  </Badge>
                  <Badge variant="secondary">
                    <Shield className="h-3 w-3 mr-1" />
                    {log.role_name}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {log.performed_by ? `By ${log.performed_by.slice(0, 8)}...` : "System"} •{" "}
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </p>
                {log.reason && <p className="text-xs text-muted-foreground italic">{log.reason}</p>}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
