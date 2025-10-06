"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface TierLimitAlertProps {
  title: string
  description: string
  onUpgrade: () => void
}

export function TierLimitAlert({ title, description, onUpgrade }: TierLimitAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between">
        <span>{description}</span>
        <Button variant="outline" size="sm" onClick={onUpgrade} className="ml-4 bg-transparent">
          Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  )
}
