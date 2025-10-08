"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

type ConsentStatus = "not-set" | "essential-only" | "all-accepted"

interface CookieConsentState {
  consent: ConsentStatus
  timestamp: Date | null
}

interface CookieConsentContextType {
  consentState: CookieConsentState
  acceptAll: () => void
  acceptEssentialOnly: () => void
  updatePreferences: (analyticsEnabled: boolean) => void
  openSettings: () => void
  closeSettings: () => void
  isSettingsOpen: boolean
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

const CONSENT_STORAGE_KEY = "cookie-consent"

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consentState, setConsentState] = useState<CookieConsentState>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          return {
            consent: parsed.consent,
            timestamp: parsed.timestamp ? new Date(parsed.timestamp) : null,
          }
        }
      } catch (error) {
        console.error("Failed to load cookie consent from localStorage:", error)
      }
    }
    return {
      consent: "not-set",
      timestamp: null,
    }
  })

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && consentState.consent !== "not-set") {
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentState))
      } catch (error) {
        console.error("Failed to save cookie consent to localStorage:", error)
      }
    }
  }, [consentState])

  const acceptAll = useCallback(() => {
    setConsentState({
      consent: "all-accepted",
      timestamp: new Date(),
    })
  }, [])

  const acceptEssentialOnly = useCallback(() => {
    setConsentState({
      consent: "essential-only",
      timestamp: new Date(),
    })
  }, [])

  const updatePreferences = useCallback((analyticsEnabled: boolean) => {
    setConsentState({
      consent: analyticsEnabled ? "all-accepted" : "essential-only",
      timestamp: new Date(),
    })
    setIsSettingsOpen(false)
  }, [])

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false)
  }, [])

  return (
    <CookieConsentContext.Provider
      value={{
        consentState,
        acceptAll,
        acceptEssentialOnly,
        updatePreferences,
        openSettings,
        closeSettings,
        isSettingsOpen,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider")
  }
  return context
}
