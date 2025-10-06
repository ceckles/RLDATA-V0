"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Crown } from "lucide-react"
import { useState } from "react"

export function UpgradeCard() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly")

  const handleUpgrade = async (planType: "monthly" | "annual") => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Upgrade error:", error)
      alert("Failed to start upgrade process. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Upgrade to Premium
        </CardTitle>
        <CardDescription>Unlock unlimited tracking and advanced analytics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedPlan === "monthly" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <div className="text-sm font-medium">Monthly</div>
            <div className="text-2xl font-bold mt-1">$5.99</div>
            <div className="text-xs text-muted-foreground">per month</div>
          </button>
          <button
            onClick={() => setSelectedPlan("annual")}
            className={`p-4 rounded-lg border-2 transition-all relative ${
              selectedPlan === "annual" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <div className="absolute -top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              Save 17%
            </div>
            <div className="text-sm font-medium">Annual</div>
            <div className="text-2xl font-bold mt-1">$60</div>
            <div className="text-xs text-muted-foreground">per year</div>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm">Unlimited firearms, components, and sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm">Advanced performance analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm">Detailed charts and insights</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm">Priority support</span>
          </div>
        </div>
        <Button onClick={() => handleUpgrade(selectedPlan)} disabled={isLoading} className="w-full">
          {isLoading ? "Loading..." : `Upgrade ${selectedPlan === "annual" ? "Annually" : "Monthly"}`}
        </Button>
      </CardContent>
    </Card>
  )
}
