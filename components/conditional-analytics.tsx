"use client"

import { Analytics } from "@vercel/analytics/next"
import { useCookieConsent } from "@/lib/cookie-consent-context"

export function ConditionalAnalytics() {
  const { consentState } = useCookieConsent()

  if (consentState.consent !== "all-accepted") {
    return null
  }

  return <Analytics />
}
