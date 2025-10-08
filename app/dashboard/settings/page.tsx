import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubscriptionBadge } from "@/components/subscription-badge"
import { UpgradeCard } from "@/components/upgrade-card"
import { ManageSubscriptionButton } from "@/components/manage-subscription-button"
import { AccountSettings } from "@/components/account-settings"
import { CookieSettingsButton } from "@/components/cookie-settings-button"
import { UserRolesCard } from "@/components/user-roles-card"
import { Settings } from "lucide-react"
import { getUserRoles } from "@/lib/roles"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) return null

  const ssoAvatarUrl = user.user_metadata?.avatar_url || null

  const userRoles = await getUserRoles(user.id)

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
        <AccountSettings profile={profile} ssoAvatarUrl={ssoAvatarUrl} />

        <UserRolesCard roles={userRoles} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <div className="mt-1">
                <SubscriptionBadge tier={profile?.subscription_tier || "basic"} />
              </div>
            </div>
            {profile?.subscription_tier === "premium" && (
              <>
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
              </>
            )}
          </CardContent>
        </Card>

        {(!profile?.subscription_tier || profile?.subscription_tier === "basic") && <UpgradeCard />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Privacy & Cookies</CardTitle>
          <CardDescription>Manage your cookie preferences and privacy settings</CardDescription>
        </CardHeader>
        <CardContent>
          <CookieSettingsButton />
        </CardContent>
      </Card>
    </div>
  )
}
