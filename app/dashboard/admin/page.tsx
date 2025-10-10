import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminUserTable } from "@/components/admin-user-table"
import { AdminStats } from "@/components/admin-stats"
import { AdminAuditLog } from "@/components/admin-audit-log"
import { AdminBugReports } from "@/components/admin-bug-reports"
import { Shield, Users, Activity } from "lucide-react"
import { hasRole } from "@/lib/roles"

export const revalidate = 0
export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const isAdmin = await hasRole(user.id, "admin")

  if (!isAdmin) {
    redirect("/unauthorized")
  }

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (usersError) {
    console.error("[v0] Error fetching users:", usersError)
  }

  const { data: roleAssignments, error: rolesError } = await supabase.from("user_roles").select(`
      user_id,
      role_id,
      assigned_at,
      expires_at,
      roles (
        id,
        name,
        description
      )
    `)

  if (rolesError) {
    console.error("[v0] Error fetching role assignments:", rolesError)
  }

  const { data: auditLogs, error: auditError } = await supabase
    .from("role_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  if (auditError) {
    console.error("[v0] Error fetching audit logs:", auditError)
  }

  const usersWithRoles =
    users?.map((user) => ({
      ...user,
      roles:
        roleAssignments
          ?.filter((ra) => ra.user_id === user.id && ra.roles)
          .map((ra) => {
            const roleData = ra.roles as any
            return {
              id: ra.role_id,
              name: roleData?.name || "unknown",
              display_name: roleData?.name || "Unknown",
              description: roleData?.description || "",
              assigned_at: ra.assigned_at,
              expires_at: ra.expires_at,
            }
          })
          .filter((role) => role.name !== "unknown") || [],
    })) || []

  const totalUsers = users?.length || 0
  const premiumUsers = users?.filter((u) => u.subscription_tier === "premium").length || 0
  const adminUsers = usersWithRoles.filter((u) => u.roles.some((r) => r.name === "admin")).length
  const subscriberUsers = usersWithRoles.filter((u) => u.roles.some((r) => r.name === "subscriber")).length

  console.log("[v0] Admin dashboard data:", {
    totalUsers,
    premiumUsers,
    adminUsers,
    subscriberUsers,
    usersWithRolesCount: usersWithRoles.length,
    auditLogsCount: auditLogs?.length || 0,
  })

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage users, roles, and system settings</p>
        </div>
      </div>

      <AdminStats
        totalUsers={totalUsers}
        premiumUsers={premiumUsers}
        adminUsers={adminUsers}
        subscriberUsers={subscriberUsers}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>View and manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUserTable users={usersWithRoles} />
        </CardContent>
      </Card>

      <AdminBugReports />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Log
          </CardTitle>
          <CardDescription>Recent role assignment and removal activities</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminAuditLog logs={auditLogs || []} />
        </CardContent>
      </Card>
    </div>
  )
}
