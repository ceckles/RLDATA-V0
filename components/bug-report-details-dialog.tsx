"use client"

import { useState, useEffect } from "react"
import { Bug, MessageSquare, Send } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useToast } from "@/hooks/use-toast"
import { formatBrowserData } from "@/lib/browser-data"
import type { BugReport, BugReportComment, BugReportStatus } from "@/lib/types/bug-report"
import { formatDistanceToNow } from "date-fns"

interface BugReportDetailsDialogProps {
  report: BugReport
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (report: BugReport) => void
}

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

export function BugReportDetailsDialog({ report, open, onOpenChange, onUpdate }: BugReportDetailsDialogProps) {
  const [status, setStatus] = useState<BugReportStatus>(report.status)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<BugReportComment[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchComments()
    }
  }, [open, report.id])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/bug-reports/${report.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error("[v0] Error fetching comments:", error)
    }
  }

  const handleStatusUpdate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/bug-reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      const data = await response.json()
      onUpdate(data.bugReport)
      toast({
        title: "Status updated",
        description: "Bug report status has been updated successfully",
      })
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return

    setIsAddingComment(true)
    try {
      const response = await fetch(`/api/bug-reports/${report.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      })

      if (!response.ok) throw new Error("Failed to add comment")

      const data = await response.json()
      setComments([...comments, data.comment])
      setComment("")
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      })
    } catch (error) {
      console.error("[v0] Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setIsAddingComment(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            {report.title}
          </DialogTitle>
          <DialogDescription>
            Submitted by {report.user?.full_name || report.user?.email || "Unknown"}{" "}
            <span suppressHydrationWarning>
              {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={(value) => setStatus(value as BugReportStatus)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="working">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
              {status !== report.status && (
                <Button onClick={handleStatusUpdate} disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Status"}
                </Button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <div className="p-4 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap">{report.description}</p>
            </div>
          </div>

          {/* Screenshot */}
          {report.screenshot_url && (
            <div className="space-y-2">
              <Label>Screenshot</Label>
              <img
                src={report.screenshot_url || "/placeholder.svg"}
                alt="Bug screenshot"
                className="w-full rounded-lg border"
              />
            </div>
          )}

          {/* Browser Data */}
          <div className="space-y-2">
            <Label>Technical Information</Label>
            <div className="p-4 bg-muted rounded-lg">
              <pre className="text-xs whitespace-pre-wrap font-mono">{formatBrowserData(report.browser_data)}</pre>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </Label>

            {comments.length > 0 && (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{c.user?.full_name || c.user?.email || "Admin"}</span>
                      <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{c.comment}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddComment} disabled={!comment.trim() || isAddingComment} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {isAddingComment ? "Adding..." : "Add Comment"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
