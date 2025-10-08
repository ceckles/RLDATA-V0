"use client"

import type { ReactNode } from "react"
import type { UserRole, Profile } from "@/lib/types"
import { hasPremiumAccess } from "@/lib/permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"

interface PremiumFeatureGuardProps {
  children: ReactNode
  profile: Profile | null
  userRoles: UserRole[]
  featureName?: string
  description?: string
}

/**
 * Guard component for premium features
 */
export function PremiumFeatureGuard({
  children,
  profile,
  userRoles,
  featureName = "This feature",
  description = "Upgrade to premium to unlock this feature",
}: PremiumFeatureGuardProps) {
  const router = useRouter()
  const isPremium = hasPremiumAccess(profile, userRoles)

  if (!isPremium) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>{featureName} - Premium Only</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push("/dashboard/settings")}>Upgrade to Premium</Button>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}
