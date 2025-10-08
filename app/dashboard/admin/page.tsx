import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminUserTable } from "@/components/admin-user-table"
import { AdminStats } from "@/components/admin-stats"
import { AdminAuditLog } from "@/components/admin-audit-log"
import { Shield, Users, Activity } from "lucide-react"
import { hasRole } from "@/lib/roles"

export const revalidate = 0

export default async function AdminPage() {
  console.log("[v0] Admin page loading...")

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] User:", user?.id)

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has admin role
  console.log("[v0] Checking admin role...")
  const isAdmin = await hasRole(user.id, "admin")
  console.log("[v0] Is admin:", isAdmin)

  if (!isAdmin) {
    redirect("/unauthorized")
  }

  console.log("[v0] Fetching users...")
  // Fetch all users with their profiles and roles
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      full_name,
      avatar_url,
      subscription_status,
      subscription_tier,
      subscription_end_date,
      created_at
    `,
    )
    .order("created_at", { ascending: false })

  console.log("[v0] Users fetched:", users?.length, "Error:", usersError)

  console.log("[v0] Fetching role assignments...")
  // Fetch role assignments for all users
  const { data: roleAssignments, error: rolesError } = await supabase
    .from("user_roles")
    .select(
      `
      user_id,
      role_id,
      assigned_at,
      expires_at,
      roles (
        id,
        name,
        display_name,
        description
      )
    `,
    )
    .order("assigned_at", { ascending: false })

  console.log("[v0] Role assignments fetched:", roleAssignments?.length, "Error:", rolesError)

  console.log("[v0] Fetching audit logs...")
  // Fetch audit logs
  const { data: auditLogs, error: auditError } = await supabase
    .from("role_audit_log")
    .select(
      `
      id,
      user_id,
      role_id,
      action,
      performed_by,
      performed_at,
      metadata,
      roles (
        name,
        display_name
      ),
      profiles!role_audit_log_user_id_fkey (
        email,
        full_name
      ),
      admin:profiles!role_audit_log_performed_by_fkey (
        email,
        full_name
      )
    `,
    )
    .order("performed_at", { ascending: false })
    .limit(50)

  console.log("[v0] Audit logs fetched:", auditLogs?.length, "Error:", auditError)

  // Combine users with their roles
  const usersWithRoles =
    users?.map((user) => ({
      ...user,
      roles:
        roleAssignments
          ?.filter((ra) => ra.user_id === user.id)
          .map((ra) => ({
            id: ra.role_id,
            name: ra.roles?.name || "",
            display_name: ra.roles?.display_name || "",
            description: ra.roles?.description || "",
            assigned_at: ra.assigned_at,
            expires_at: ra.expires_at,
          })) || [],
    })) || []

  console.log("[v0] Users with roles:", usersWithRoles.length)

  // Calculate stats
  const totalUsers = users?.length || 0
  const premiumUsers = users?.filter((u) => u.subscription_tier === "premium").length || 0
  const adminUsers = usersWithRoles.filter((u) => u.roles.some((r) => r.name === "admin")).length
  const subscriberUsers = usersWithRoles.filter((u) => u.roles.some((r) => r.name === "subscriber")).length

  console.log("[v0] Stats:", { totalUsers, premiumUsers, adminUsers, subscriberUsers })

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
