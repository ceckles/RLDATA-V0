import { createClient } from "@/lib/supabase/server"
import { FirearmsList } from "@/components/firearms-list"
import { AddFirearmDialog } from "@/components/add-firearm-dialog"
import { getTierLimits } from "@/lib/tier-limits"
import { Badge } from "@/components/ui/badge"
import { Target, Crown } from "lucide-react"
import Link from "next/link"

export default async function FirearmsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: firearms } = await supabase
    .from("firearms")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const limits = getTierLimits(profile?.subscription_tier || "basic")

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8" />
            Firearms Registry
            {profile?.subscription_tier === "basic" && (
              <Badge variant="outline" className="ml-2">
                {firearms?.length || 0}/{limits.firearms}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Manage your firearms collection
            {profile?.subscription_tier === "basic" && (
              <Link href="/dashboard/settings" className="ml-2 text-primary hover:underline inline-flex items-center">
                <Crown className="h-3 w-3 mr-1" />
                Upgrade for unlimited
              </Link>
            )}
          </p>
        </div>
        <AddFirearmDialog
          userId={user.id}
          tier={profile?.subscription_tier || "basic"}
          currentCount={firearms?.length || 0}
        />
      </div>

      <FirearmsList firearms={firearms || []} />
    </div>
  )
}
