"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Firearm, MaintenanceSchedule } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { Calendar, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

interface MaintenanceScheduleDialogProps {
  firearm: Firearm
  schedules: MaintenanceSchedule[]
}

export function MaintenanceScheduleDialog({ firearm, schedules }: MaintenanceScheduleDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    type: "cleaning" as MaintenanceSchedule["type"],
    interval_type: "rounds" as "rounds" | "days" | "months",
    interval_value: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Not authenticated")

      const { error } = await supabase.from("maintenance_schedules").insert({
        firearm_id: firearm.id,
        user_id: userData.user.id,
        name: formData.name,
        type: formData.type,
        interval_type: formData.interval_type,
        interval_value: Number.parseInt(formData.interval_value),
        notes: formData.notes || null,
      })

      if (error) throw error

      toast.success("Maintenance schedule added")
      setOpen(false)
      setFormData({
        name: "",
        type: "cleaning",
        interval_type: "rounds",
        interval_value: "",
        notes: "",
      })
      router.refresh()
    } catch (error) {
      console.error("Error adding maintenance schedule:", error)
      toast.error("Failed to add maintenance schedule")
    } finally {
      setIsLoading(false)
    }
  }

  const getMaintenanceStatus = (schedule: MaintenanceSchedule) => {
    if (!schedule.last_completed_at && !schedule.last_completed_round_count) {
      return { status: "pending", message: "Not yet completed" }
    }

    if (schedule.interval_type === "rounds") {
      const roundsSinceLastMaintenance = firearm.round_count - (schedule.last_completed_round_count || 0)
      const roundsUntilDue = schedule.interval_value - roundsSinceLastMaintenance

      if (roundsUntilDue <= 0) {
        return { status: "overdue", message: `Overdue by ${Math.abs(roundsUntilDue)} rounds` }
      }
      if (roundsUntilDue <= schedule.interval_value * 0.2) {
        return { status: "due-soon", message: `Due in ${roundsUntilDue} rounds` }
      }
      return { status: "ok", message: `Due in ${roundsUntilDue} rounds` }
    }

    if (schedule.interval_type === "days" && schedule.last_completed_at) {
      const daysSinceLastMaintenance = Math.floor(
        (Date.now() - new Date(schedule.last_completed_at).getTime()) / (1000 * 60 * 60 * 24),
      )
      const daysUntilDue = schedule.interval_value - daysSinceLastMaintenance

      if (daysUntilDue <= 0) {
        return { status: "overdue", message: `Overdue by ${Math.abs(daysUntilDue)} days` }
      }
      if (daysUntilDue <= schedule.interval_value * 0.2) {
        return { status: "due-soon", message: `Due in ${daysUntilDue} days` }
      }
      return { status: "ok", message: `Due in ${daysUntilDue} days` }
    }

    return { status: "ok", message: "On schedule" }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950 dark:hover:text-green-300 bg-transparent"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Maintenance Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Maintenance Schedule - {firearm.name}</DialogTitle>
          <DialogDescription>Current round count: {firearm.round_count.toLocaleString()} rounds</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Schedules */}
          {schedules.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Active Schedules</h3>
              <div className="space-y-2">
                {schedules.map((schedule) => {
                  const status = getMaintenanceStatus(schedule)
                  return (
                    <div
                      key={schedule.id}
                      className={`rounded-lg border p-3 ${
                        status.status === "overdue"
                          ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                          : status.status === "due-soon"
                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                            : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{schedule.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {schedule.type} • Every {schedule.interval_value} {schedule.interval_type}
                          </p>
                          <p className="text-sm mt-1">{status.message}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add New Schedule Form */}
          <div className="space-y-3">
            <h3 className="font-semibold">Add New Schedule</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Schedule Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Deep Clean, Spring Replacement"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Maintenance Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as MaintenanceSchedule["type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="lubrication">Lubrication</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="parts_replacement">Parts Replacement</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="modification">Modification</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="interval_type">Interval Type *</Label>
                  <Select
                    value={formData.interval_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, interval_type: value as "rounds" | "days" | "months" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rounds">Rounds Fired</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="interval_value">
                    Every {formData.interval_type === "rounds" ? "X Rounds" : `X ${formData.interval_type}`} *
                  </Label>
                  <Input
                    id="interval_value"
                    type="number"
                    min="1"
                    value={formData.interval_value}
                    onChange={(e) => setFormData({ ...formData, interval_value: e.target.value })}
                    placeholder={formData.interval_type === "rounds" ? "500" : "30"}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this maintenance schedule..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button type="submit" disabled={isLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isLoading ? "Adding..." : "Add Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
