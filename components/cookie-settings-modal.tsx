"use client"

import { Cookie, Shield, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCookieConsent } from "@/lib/cookie-consent-context"
import { useState, useEffect } from "react"

export function CookieSettingsModal() {
  const { consentState, updatePreferences, isSettingsOpen, closeSettings } = useCookieConsent()
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    setAnalyticsEnabled(consentState.consent === "all-accepted")
  }, [consentState.consent, isSettingsOpen])

  const handleSave = () => {
    updatePreferences(analyticsEnabled)
  }

  return (
    <Dialog open={isSettingsOpen} onOpenChange={closeSettings}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Cookie className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Cookie Preferences</DialogTitle>
          </div>
          <DialogDescription>
            Manage your cookie preferences. You can enable or disable different types of cookies below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Essential Cookies</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="essential" className="text-sm text-muted-foreground">
                    Always Active
                  </Label>
                  <Switch id="essential" checked={true} disabled />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                These cookies are necessary for the website to function and cannot be disabled. They enable core
                functionality such as security, authentication, and session management.
              </CardDescription>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>
                  <strong>Purpose:</strong> Authentication, security, user preferences
                </p>
                <p>
                  <strong>Duration:</strong> Session and persistent
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Analytics Cookies</CardTitle>
                </div>
                <Switch
                  id="analytics"
                  checked={analyticsEnabled}
                  onCheckedChange={setAnalyticsEnabled}
                  aria-label="Toggle analytics cookies"
                />
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                These cookies help us understand how visitors interact with our website by collecting and reporting
                information anonymously. This helps us improve the user experience.
              </CardDescription>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>
                  <strong>Purpose:</strong> Usage analytics, performance monitoring
                </p>
                <p>
                  <strong>Provider:</strong> Vercel Analytics
                </p>
                <p>
                  <strong>Duration:</strong> Up to 2 years
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={closeSettings}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
