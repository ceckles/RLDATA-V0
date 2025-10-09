"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { syncSubscriptionRole } from "@/app/actions/sync-subscription-role"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function SyncSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setIsLoading(true)
    try {
      const result = await syncSubscriptionRole()

      if (result.success) {
        toast.success(result.message || "Roles synced successfully")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to sync roles")
        console.error("[v0] Sync error:", result.error)
      }
    } catch (error) {
      console.error("[v0] Sync error:", error)
      toast.error("An error occurred while syncing roles")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={isLoading} variant="outline" size="sm">
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
      Sync Subscription Role
    </Button>
  )
}
