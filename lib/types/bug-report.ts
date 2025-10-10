export type BugReportStatus = "submitted" | "working" | "resolved" | "fixed"

export interface BrowserData {
  userAgent: string
  screenResolution: string
  viewport: string
  url: string
  timestamp: string
  language: string
  platform: string
  cookiesEnabled: boolean
}

export interface BugReport {
  id: string
  user_id: string
  title: string
  description: string
  screenshot_url: string | null
  status: BugReportStatus
  browser_data: BrowserData
  created_at: string
  updated_at: string
  user?: {
    full_name: string | null
    email: string
  }
}

export interface BugReportComment {
  id: string
  bug_report_id: string
  user_id: string
  comment: string
  created_at: string
  user?: {
    full_name: string | null
    email: string
  }
}
