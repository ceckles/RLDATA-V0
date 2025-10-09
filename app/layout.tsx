import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { CookieConsentProvider } from "@/lib/cookie-consent-context"
import { CookieConsentModal } from "@/components/cookie-consent-modal"
import { CookieSettingsModal } from "@/components/cookie-settings-modal"
import { ConditionalAnalytics } from "@/components/conditional-analytics"
import "./globals.css"

export const metadata: Metadata = {
  title: "ReloadData - Reloading Data Management",
  description: "Track your reloading components, firearms, and shooting sessions",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <CookieConsentProvider>
            <Suspense fallback={<div>Loading...</div>}>
              {children}
              <ConditionalAnalytics />
            </Suspense>
            <Toaster />
            <CookieConsentModal />
            <CookieSettingsModal />
          </CookieConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
