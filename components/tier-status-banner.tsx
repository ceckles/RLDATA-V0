"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { SubscriptionTier } from "@/lib/types"
import { getTierLimits } from "@/lib/tier-limits"
import { Crown } from "lucide-react"
import Link from "next/link"

interface TierStatusBannerProps {
  tier: SubscriptionTier
  firearmsCount: number
  componentsCount: Record<string, number>
  sessionsCount: number
}

export function TierStatusBanner({ tier, firearmsCount, componentsCount, sessionsCount }: TierStatusBannerProps) {
  if (tier === "premium") return null

  const limits = getTierLimits(tier)
  const firearmsPercent = (firearmsCount / limits.firearms) * 100
  const sessionsPercent = (sessionsCount / limits.sessions) * 100

  const totalComponentsCount = Object.values(componentsCount).reduce((sum, count) => sum + count, 0)
  const componentsPercent = (totalComponentsCount / limits.totalComponents) * 100

  return (
    <Alert>
      <Crown className="h-4 w-4" />
      <AlertTitle>Basic Plan Limits</AlertTitle>
      <AlertDescription className="space-y-3">
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Firearms</span>
              <span>
                {firearmsCount} / {limits.firearms}
              </span>
            </div>
            <Progress value={firearmsPercent} />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Sessions</span>
              <span>
                {sessionsCount} / {limits.sessions}
              </span>
            </div>
            <Progress value={sessionsPercent} />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Components (total)</span>
              <span>
                {totalComponentsCount} / {limits.totalComponents}
              </span>
            </div>
            <Progress value={componentsPercent} />
          </div>
        </div>
        <Link href="/dashboard/settings">
          <Button size="sm" className="w-full">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Premium for Unlimited
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  )
}
