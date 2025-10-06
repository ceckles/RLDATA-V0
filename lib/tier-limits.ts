import type { SubscriptionTier } from "./types"

export interface TierLimits {
  firearms: number
  totalComponents: number
  sessions: number
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  basic: {
    firearms: 3,
    totalComponents: 20,
    sessions: 10,
  },
  premium: {
    firearms: Number.POSITIVE_INFINITY,
    totalComponents: Number.POSITIVE_INFINITY,
    sessions: Number.POSITIVE_INFINITY,
  },
}

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier]
}

export function canAddItem(currentCount: number, tier: SubscriptionTier, limitType: keyof TierLimits): boolean {
  const limits = getTierLimits(tier)
  return currentCount < limits[limitType]
}

export function getRemainingItems(currentCount: number, tier: SubscriptionTier, limitType: keyof TierLimits): number {
  const limits = getTierLimits(tier)
  const limit = limits[limitType]
  if (limit === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY
  return Math.max(0, limit - currentCount)
}
