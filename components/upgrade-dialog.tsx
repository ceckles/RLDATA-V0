"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Check, Crown } from "lucide-react"
import { useState } from "react"

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>Unlock unlimited tracking and advanced analytics</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedPlan === "monthly" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="text-sm font-medium">Monthly</div>
              <div className="text-xl font-bold mt-1">$5.99</div>
              <div className="text-xs text-muted-foreground">per month</div>
            </button>
            <button
              onClick={() => setSelectedPlan("annual")}
              className={`p-3 rounded-lg border-2 transition-all relative ${
                selectedPlan === "annual" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="absolute -top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </div>
              <div className="text-sm font-medium">Annual</div>
              <div className="text-xl font-bold mt-1">$60</div>
              <div className="text-xs text-muted-foreground">per year</div>
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Unlimited Firearms</p>
                <p className="text-sm text-muted-foreground">Track as many firearms as you need</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Unlimited Components</p>
                <p className="text-sm text-muted-foreground">No limits on primers, powder, bullets, or brass</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Unlimited Sessions</p>
                <p className="text-sm text-muted-foreground">Log every range trip without restrictions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Advanced Analytics</p>
                <p className="text-sm text-muted-foreground">Detailed performance insights and trends</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Priority Support</p>
                <p className="text-sm text-muted-foreground">Get help when you need it</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Maybe Later
          </Button>
          <Button onClick={() => handleUpgrade(selectedPlan)} disabled={isLoading}>
            {isLoading ? "Loading..." : `Upgrade ${selectedPlan === "annual" ? "Annually" : "Monthly"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
