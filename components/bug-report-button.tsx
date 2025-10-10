"use client"

import { Bug } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"
import { BugReportDialog } from "./bug-report-dialog"

export function BugReportButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        aria-label="Report a bug"
      >
        <Bug className="h-6 w-6" />
      </Button>
      <BugReportDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
