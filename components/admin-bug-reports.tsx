"use client"

import { useEffect, useState } from "react"
import { Bug, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { BugReportDetailsDialog } from "./bug-report-details-dialog"
import type { BugReport } from "@/lib/types/bug-report"
import { formatDistanceToNow } from "date-fns"

const statusColors = {
  submitted: "bg-blue-500",
  working: "bg-yellow-500",
  resolved: "bg-green-500",
  fixed: "bg-purple-500",
}

const statusLabels = {
  submitted: "Submitted",
  working: "In Progress",
  resolved: "Resolved",
  fixed: "Fixed",
}

export function AdminBugReports() {
  const [bugReports, setBugReports] = useState<BugReport[]>([])
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBugReports()
  }, [])

  const fetchBugReports = async () => {
    try {
      const response = await fetch("/api/bug-reports")
      if (response.ok) {
        const data = await response.json()
        setBugReports(data.bugReports)
      }
    } catch (error) {
      console.error("[v0] Error fetching bug reports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReportUpdate = (updatedReport: BugReport) => {
    setBugReports((reports) => reports.map((report) => (report.id === updatedReport.id ? updatedReport : report)))
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading bug reports...</div>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Bug Reports
          </CardTitle>
          <CardDescription>Review and manage user-submitted bug reports</CardDescription>
        </CardHeader>
        <CardContent>
          {bugReports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bug reports yet</p>
          ) : (
            <div className="space-y-4">
              {bugReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{report.title}</h4>
                      <Badge className={statusColors[report.status]}>{statusLabels[report.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>By: {report.user?.full_name || report.user?.email || "Unknown"}</span>
                      <span suppressHydrationWarning>
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedReport && (
        <BugReportDetailsDialog
          report={selectedReport}
          open={!!selectedReport}
          onOpenChange={(open) => !open && setSelectedReport(null)}
          onUpdate={handleReportUpdate}
        />
      )}
    </>
  )
}
