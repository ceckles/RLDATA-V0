import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubscriptionBadge } from "@/components/subscription-badge"
import { UpgradeCard } from "@/components/upgrade-card"
import { ManageSubscriptionButton } from "@/components/manage-subscription-button"
import { Settings } from "lucide-react"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account and subscription</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{profile?.full_name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{profile?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subscription</p>
              <div className="mt-1">
                <SubscriptionBadge tier={profile?.subscription_tier || "basic"} />
              </div>
            </div>
          </CardContent>
        </Card>

        {(!profile?.subscription_tier || profile?.subscription_tier === "basic") && <UpgradeCard />}

        {profile?.subscription_tier === "premium" && (
          <Card>
            <CardHeader>
              <CardTitle>Premium Subscription</CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{profile.subscription_status || "Active"}</p>
              </div>
              {profile.subscription_ends_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Renews</p>
                  <p className="font-medium">{new Date(profile.subscription_ends_at).toLocaleDateString()}</p>
                </div>
              )}
              <ManageSubscriptionButton />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
