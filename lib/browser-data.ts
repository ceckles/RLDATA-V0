import type { BrowserData } from "./types/bug-report"

export function collectBrowserData(): BrowserData {
  return {
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    language: navigator.language,
    platform: navigator.platform,
    cookiesEnabled: navigator.cookieEnabled,
  }
}

export function formatBrowserData(data: BrowserData): string {
  return `
**Browser Information:**
- User Agent: ${data.userAgent}
- Screen Resolution: ${data.screenResolution}
- Viewport: ${data.viewport}
- URL: ${data.url}
- Language: ${data.language}
- Platform: ${data.platform}
- Cookies Enabled: ${data.cookiesEnabled ? "Yes" : "No"}
- Timestamp: ${new Date(data.timestamp).toLocaleString()}
  `.trim()
}
