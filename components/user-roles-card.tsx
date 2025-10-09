"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleBadgesList } from "@/components/role-badges-list"
import type { UserRoleWithDetails } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { Calendar, Clock } from "lucide-react"

interface UserRolesCardProps {
  roles: UserRoleWithDetails[]
}

export function UserRolesCard({ roles }: UserRolesCardProps) {
  const validRoles = roles?.filter((role) => role && role.role_name) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Roles</CardTitle>
        <CardDescription>Active roles and permissions assigned to your account</CardDescription>
      </CardHeader>
      <CardContent>
        {validRoles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No special roles assigned</p>
        ) : (
          <div className="space-y-4">
            <RoleBadgesList roles={validRoles} />

            <div className="space-y-3 pt-2">
              {validRoles.map((role) => (
                <div
                  key={role.role_name}
                  className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm"
                >
                  <div className="space-y-1">
                    <p className="font-medium capitalize">{role.role_name}</p>
                    {role.role_description && <p className="text-xs text-muted-foreground">{role.role_description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                    {role.assigned_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Assigned {formatDistanceToNow(new Date(role.assigned_at), { addSuffix: true })}</span>
                      </div>
                    )}
                    {role.expires_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Expires {formatDistanceToNow(new Date(role.expires_at), { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
