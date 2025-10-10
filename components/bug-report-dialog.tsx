"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Bug, Upload, X, Info } from "lucide-react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Alert, AlertDescription } from "./ui/alert"
import { collectBrowserData } from "@/lib/browser-data"
import { useToast } from "@/hooks/use-toast"

interface BugReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BugReportDialog({ open, onOpenChange }: BugReportDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, WebP, or GIF)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setScreenshot(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveScreenshot = () => {
    setScreenshot(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const browserData = collectBrowserData()
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("browserData", JSON.stringify(browserData))
      if (screenshot) {
        formData.append("screenshot", screenshot)
      }

      const response = await fetch("/api/bug-reports", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit bug report")
      }

      toast({
        title: "Bug report submitted",
        description: "Thank you for helping us improve!",
      })

      // Reset form
      setTitle("")
      setDescription("")
      handleRemoveScreenshot()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error submitting bug report:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit bug report",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting issues you encounter. We'll collect some technical information to help us
            diagnose the problem.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please describe the bug in detail. What were you doing when it occurred? What did you expect to happen?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot">Screenshot (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {screenshot ? "Change Screenshot" : "Upload Screenshot"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Max file size: 5MB. Supported formats: JPEG, PNG, WebP, GIF</p>
          </div>

          {previewUrl && (
            <div className="relative">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Screenshot preview"
                className="w-full rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveScreenshot}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Data Collection Notice:</strong> When you submit this report, we'll automatically collect:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Browser type and version</li>
                <li>Screen resolution and viewport size</li>
                <li>Current page URL</li>
                <li>Language and platform settings</li>
                <li>Timestamp of the report</li>
              </ul>
              This information helps us reproduce and fix the issue.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
