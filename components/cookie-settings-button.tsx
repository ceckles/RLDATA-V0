"use client"

import { Cookie } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCookieConsent } from "@/lib/cookie-consent-context"

export function CookieSettingsButton() {
  const { openSettings, consentState } = useCookieConsent()

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        <p>
          Current preference:{" "}
          <span className="font-medium text-foreground">
            {consentState.consent === "all-accepted"
              ? "All cookies accepted"
              : consentState.consent === "essential-only"
                ? "Essential cookies only"
                : "Not set"}
          </span>
        </p>
        {consentState.timestamp && (
          <p className="mt-1">Last updated: {new Date(consentState.timestamp).toLocaleString()}</p>
        )}
      </div>
      <Button onClick={openSettings} variant="outline" className="w-full sm:w-auto bg-transparent">
        <Cookie className="h-4 w-4 mr-2" />
        Manage Cookie Preferences
      </Button>
    </div>
  )
}
