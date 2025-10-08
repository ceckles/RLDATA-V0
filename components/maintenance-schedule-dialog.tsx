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
import type { Firearm, MaintenanceSchedule, MaintenanceHistory } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { Calendar, Plus, Edit, Trash2, CheckCircle, History, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MaintenanceScheduleDialogProps {
  firearm: Firearm
  schedules: MaintenanceSchedule[]
  history: MaintenanceHistory[]
}

export function MaintenanceScheduleDialog({ firearm, schedules, history }: MaintenanceScheduleDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null)
  const [deletingSchedule, setDeletingSchedule] = useState<MaintenanceSchedule | null>(null)
  const [showLogMaintenance, setShowLogMaintenance] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    type: "cleaning" as MaintenanceSchedule["type"],
    interval_type: "rounds" as "rounds" | "days" | "months",
    interval_value: "",
    notes: "",
  })

  const [logFormData, setLogFormData] = useState({
    name: "",
    type: "cleaning" as MaintenanceSchedule["type"],
    completed_at: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const startEdit = (schedule: MaintenanceSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      name: schedule.name,
      type: schedule.type,
      interval_type: schedule.interval_type,
      interval_value: schedule.interval_value.toString(),
      notes: schedule.notes || "",
    })
  }

  const cancelEdit = () => {
    setEditingSchedule(null)
    setFormData({
      name: "",
      type: "cleaning",
      interval_type: "rounds",
      interval_value: "",
      notes: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Not authenticated")

      if (editingSchedule) {
        const { error } = await supabase
          .from("maintenance_schedules")
          .update({
            name: formData.name,
            type: formData.type,
            interval_type: formData.interval_type,
            interval_value: Number.parseInt(formData.interval_value),
            notes: formData.notes || null,
          })
          .eq("id", editingSchedule.id)

        if (error) throw error
        toast.success("Maintenance schedule updated")
      } else {
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
      }

      cancelEdit()
      router.refresh()
    } catch (error) {
      console.error("Error saving maintenance schedule:", error)
      toast.error("Failed to save maintenance schedule")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingSchedule) return
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("maintenance_schedules").delete().eq("id", deletingSchedule.id)

      if (error) throw error

      toast.success("Maintenance schedule deleted")
      setDeletingSchedule(null)
      router.refresh()
    } catch (error) {
      console.error("Error deleting maintenance schedule:", error)
      toast.error("Failed to delete maintenance schedule")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkComplete = async (schedule: MaintenanceSchedule) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Not authenticated")

      const { error: historyError } = await supabase.from("maintenance_history").insert({
        firearm_id: firearm.id,
        user_id: userData.user.id,
        schedule_id: schedule.id,
        name: schedule.name,
        type: schedule.type,
        completed_at: new Date().toISOString(),
        round_count_at_completion: firearm.round_count,
        notes: schedule.notes,
      })

      if (historyError) throw historyError

      const { error } = await supabase
        .from("maintenance_schedules")
        .update({
          last_completed_at: new Date().toISOString(),
          last_completed_round_count: firearm.round_count,
        })
        .eq("id", schedule.id)

      if (error) throw error

      toast.success("Maintenance marked as complete")
      router.refresh()
    } catch (error) {
      console.error("Error marking maintenance complete:", error)
      toast.error("Failed to mark maintenance complete")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Not authenticated")

      const { error } = await supabase.from("maintenance_history").insert({
        firearm_id: firearm.id,
        user_id: userData.user.id,
        schedule_id: null,
        name: logFormData.name,
        type: logFormData.type,
        completed_at: new Date(logFormData.completed_at).toISOString(),
        round_count_at_completion: firearm.round_count,
        notes: logFormData.notes || null,
      })

      if (error) throw error

      toast.success("Maintenance logged successfully")
      setShowLogMaintenance(false)
      setLogFormData({
        name: "",
        type: "cleaning",
        completed_at: new Date().toISOString().split("T")[0],
        notes: "",
      })
      router.refresh()
    } catch (error) {
      console.error("Error logging maintenance:", error)
      toast.error("Failed to log maintenance")
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
    <>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Maintenance - {firearm.name}</DialogTitle>
            <DialogDescription>Current round count: {firearm.round_count.toLocaleString()} rounds</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="schedules" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="schedules">
                <Clock className="mr-2 h-4 w-4" />
                Schedules
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                History ({history.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedules" className="space-y-6">
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
                            <div className="flex-1">
                              <p className="font-medium">{schedule.name}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {schedule.type.replace("_", " ")} • Every {schedule.interval_value}{" "}
                                {schedule.interval_type}
                              </p>
                              <p className="text-sm mt-1">{status.message}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkComplete(schedule)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0"
                                title="Mark as complete"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(schedule)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0"
                                title="Edit schedule"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingSchedule(schedule)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0"
                                title="Delete schedule"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold">{editingSchedule ? "Edit Schedule" : "Add New Schedule"}</h3>
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
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value as MaintenanceSchedule["type"] })
                      }
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
                    {editingSchedule && (
                      <Button type="button" variant="outline" onClick={cancelEdit}>
                        Cancel Edit
                      </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                      <Plus className="mr-2 h-4 w-4" />
                      {isLoading ? "Saving..." : editingSchedule ? "Update Schedule" : "Add Schedule"}
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Maintenance History</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowLogMaintenance(!showLogMaintenance)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Log Maintenance
                  </Button>
                </div>

                {showLogMaintenance && (
                  <form onSubmit={handleLogMaintenance} className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="grid gap-2">
                      <Label htmlFor="log-name">Maintenance Name *</Label>
                      <Input
                        id="log-name"
                        value={logFormData.name}
                        onChange={(e) => setLogFormData({ ...logFormData, name: e.target.value })}
                        placeholder="e.g., Field Strip & Clean"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="log-type">Type *</Label>
                        <Select
                          value={logFormData.type}
                          onValueChange={(value) =>
                            setLogFormData({ ...logFormData, type: value as MaintenanceSchedule["type"] })
                          }
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

                      <div className="grid gap-2">
                        <Label htmlFor="log-date">Date *</Label>
                        <Input
                          id="log-date"
                          type="date"
                          value={logFormData.completed_at}
                          onChange={(e) => setLogFormData({ ...logFormData, completed_at: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="log-notes">Notes</Label>
                      <Textarea
                        id="log-notes"
                        value={logFormData.notes}
                        onChange={(e) => setLogFormData({ ...logFormData, notes: e.target.value })}
                        placeholder="Details about the maintenance performed..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowLogMaintenance(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {history.length > 0 ? (
                  <div className="space-y-2">
                    {history.map((record) => (
                      <div key={record.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{record.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {record.type.replace("_", " ")} • {new Date(record.completed_at).toLocaleDateString()}
                            </p>
                            {record.round_count_at_completion !== null && (
                              <p className="text-sm text-muted-foreground">
                                Round count: {record.round_count_at_completion.toLocaleString()}
                              </p>
                            )}
                            {record.notes && <p className="text-sm mt-1 text-muted-foreground">{record.notes}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No maintenance history yet</p>
                    <p className="text-sm">Log your first maintenance to start tracking</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingSchedule} onOpenChange={(open) => !open && setDeletingSchedule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Maintenance Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSchedule?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
