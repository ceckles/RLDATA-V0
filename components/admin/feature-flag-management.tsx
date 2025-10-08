"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"

interface FeatureFlag {
  id: string
  feature_key: string
  feature_name: string
  description: string | null
  is_enabled: boolean
  created_at: string
  updated_at: string
}

interface FeatureFlagManagementProps {
  featureFlags: FeatureFlag[]
  isAdmin: boolean
}

export function FeatureFlagManagement({ featureFlags, isAdmin }: FeatureFlagManagementProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)

  const handleToggle = async (flagId: string, currentState: boolean) => {
    if (!isAdmin) return

    setUpdating(flagId)
    try {
      const response = await fetch("/api/admin/toggle-feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId, isEnabled: !currentState }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        console.error("Failed to toggle feature")
      }
    } catch (error) {
      console.error("Error toggling feature:", error)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>Enable or disable features across the application</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {featureFlags.map((flag) => (
            <div
              key={flag.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{flag.feature_name}</p>
                  <Badge variant={flag.is_enabled ? "default" : "secondary"}>
                    {flag.is_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                {flag.description && <p className="text-xs text-muted-foreground">{flag.description}</p>}
                <p className="text-xs text-muted-foreground font-mono">{flag.feature_key}</p>
              </div>
              <Switch
                checked={flag.is_enabled}
                onCheckedChange={() => handleToggle(flag.id, flag.is_enabled)}
                disabled={!isAdmin || updating === flag.id}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
