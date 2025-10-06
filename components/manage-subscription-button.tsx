"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ExternalLink } from "lucide-react"
import { toast } from "sonner"

export function ManageSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscription/portal")
      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const { error } = await response.json()
        toast.error(error || "Failed to open subscription portal")
        setIsLoading(false)
      }
    } catch (error) {
      toast.error("Failed to open subscription portal")
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleManageSubscription} className="w-full" disabled={isLoading}>
      {isLoading ? (
        "Opening portal..."
      ) : (
        <>
          Manage Subscription
          <ExternalLink className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )
}
