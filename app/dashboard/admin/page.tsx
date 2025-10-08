import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, ToggleLeft } from "lucide-react"
import { UserManagement } from "@/components/admin/user-management"
import { FeatureFlagManagement } from "@/components/admin/feature-flag-management"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get current user's profile to check role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Only allow admin and moderator access
  if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
    redirect("/dashboard")
  }

  // Fetch all users (only admins and moderators can see this)
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, subscription_tier, created_at")
    .order("created_at", { ascending: false })

  // Fetch feature flags
  const { data: featureFlags } = await supabase.from("feature_flags").select("*").order("feature_name")

  // Count users by role
  const usersByRole = users?.reduce(
    (acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, roles, and feature flags</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Shield className="h-4 w-4" />
          {profile.role === "admin" ? "Administrator" : "Moderator"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersByRole?.admin || 0}</div>
            <p className="text-xs text-muted-foreground">
              {usersByRole?.moderator || 0} moderator{(usersByRole?.moderator || 0) !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feature Flags</CardTitle>
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featureFlags?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {featureFlags?.filter((f) => f.is_enabled).length || 0} enabled
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UserManagement users={users || []} currentUserRole={profile.role} />
        <FeatureFlagManagement featureFlags={featureFlags || []} isAdmin={profile.role === "admin"} />
      </div>
    </div>
  )
}
