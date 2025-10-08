"use client"

import { Cookie } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCookieConsent } from "@/lib/cookie-consent-context"

export function CookieConsentModal() {
  const { consentState, acceptAll, acceptEssentialOnly, openSettings } = useCookieConsent()

  const isOpen = consentState.consent === "not-set"

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Cookie className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Cookie Consent</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed">
            We use cookies to ensure basic site functionality and to enhance your experience with analytics. You can
            choose which cookies to accept.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={acceptAll} size="lg" className="w-full bg-primary hover:bg-primary/90">
            Accept All Cookies
          </Button>
          <Button onClick={acceptEssentialOnly} variant="outline" size="lg" className="w-full bg-transparent">
            Essential Only
          </Button>
          <Button onClick={openSettings} variant="ghost" size="lg" className="w-full">
            Cookie Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
