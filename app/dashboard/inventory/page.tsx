import { createClient } from "@/lib/supabase/server"
import { getTierLimits } from "@/lib/tier-limits"
import { InventoryList } from "@/components/inventory-list"
import { AddComponentDialog } from "@/components/add-component-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Box, Crown } from "lucide-react"
import Link from "next/link"

export default async function InventoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: components } = await supabase
    .from("components")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const limits = getTierLimits(profile?.subscription_tier || "basic")

  const componentsByType = {
    primer: components?.filter((c) => c.type === "primer") || [],
    powder: components?.filter((c) => c.type === "powder") || [],
    bullet: components?.filter((c) => c.type === "bullet") || [],
    brass: components?.filter((c) => c.type === "brass") || [],
  }

  const totalComponents = components?.length || 0

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Box className="h-8 w-8" />
            Component Inventory
            {profile?.subscription_tier === "basic" && (
              <Badge variant="outline" className="ml-2">
                {totalComponents}/{limits.totalComponents} total
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Manage your reloading components
            {profile?.subscription_tier === "basic" && (
              <Link href="/dashboard/settings" className="ml-2 text-primary hover:underline inline-flex items-center">
                <Crown className="h-3 w-3 mr-1" />
                Upgrade for unlimited
              </Link>
            )}
          </p>
        </div>
        <AddComponentDialog
          userId={user.id}
          tier={profile?.subscription_tier || "basic"}
          componentsByType={componentsByType}
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({components?.length || 0})</TabsTrigger>
          <TabsTrigger value="primer">Primers ({componentsByType.primer.length})</TabsTrigger>
          <TabsTrigger value="powder">Powder ({componentsByType.powder.length})</TabsTrigger>
          <TabsTrigger value="bullet">Bullets ({componentsByType.bullet.length})</TabsTrigger>
          <TabsTrigger value="brass">Brass ({componentsByType.brass.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <InventoryList components={components || []} />
        </TabsContent>
        <TabsContent value="primer" className="mt-6">
          <InventoryList components={componentsByType.primer} />
        </TabsContent>
        <TabsContent value="powder" className="mt-6">
          <InventoryList components={componentsByType.powder} />
        </TabsContent>
        <TabsContent value="bullet" className="mt-6">
          <InventoryList components={componentsByType.bullet} />
        </TabsContent>
        <TabsContent value="brass" className="mt-6">
          <InventoryList components={componentsByType.brass} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
