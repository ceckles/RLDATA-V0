import { Badge } from "@/components/ui/badge"
import type { SubscriptionTier } from "@/lib/types"
import { Crown } from "lucide-react"

interface SubscriptionBadgeProps {
  tier: SubscriptionTier
  className?: string
}

export function SubscriptionBadge({ tier, className }: SubscriptionBadgeProps) {
  if (tier === "premium") {
    return (
      <Badge variant="default" className={className}>
        <Crown className="mr-1 h-3 w-3" />
        Premium
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className={className}>
      Basic
    </Badge>
  )
}
