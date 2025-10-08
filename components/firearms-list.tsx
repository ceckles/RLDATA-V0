"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Firearm, MaintenanceSchedule, MaintenanceHistory } from "@/lib/types"
import { Edit, Trash2, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { EditFirearmDialog } from "./edit-firearm-dialog"
import { DeleteFirearmDialog } from "./delete-firearm-dialog"
import { MaintenanceScheduleDialog } from "./maintenance-schedule-dialog"

interface FirearmsListProps {
  firearms: Firearm[]
  maintenanceSchedules: MaintenanceSchedule[]
  maintenanceHistory: MaintenanceHistory[]
}

export function FirearmsList({ firearms, maintenanceSchedules, maintenanceHistory }: FirearmsListProps) {
  const [editingFirearm, setEditingFirearm] = useState<Firearm | null>(null)
  const [deletingFirearm, setDeletingFirearm] = useState<Firearm | null>(null)

  const getFirearmMaintenanceStatus = (firearm: Firearm) => {
    const firearmSchedules = maintenanceSchedules.filter((s) => s.firearm_id === firearm.id)
    if (firearmSchedules.length === 0) return null

    const overdueItems: { name: string; message: string }[] = []
    const dueSoonItems: { name: string; message: string }[] = []

    firearmSchedules.forEach((schedule) => {
      if (schedule.interval_type === "rounds") {
        const roundsSinceLastMaintenance = firearm.round_count - (schedule.last_completed_round_count || 0)
        const roundsUntilDue = schedule.interval_value - roundsSinceLastMaintenance

        if (roundsUntilDue <= 0) {
          overdueItems.push({
            name: schedule.name,
            message: `Overdue by ${Math.abs(roundsUntilDue)} rounds`,
          })
        } else if (roundsUntilDue <= schedule.interval_value * 0.2) {
          dueSoonItems.push({
            name: schedule.name,
            message: `Due in ${roundsUntilDue} rounds`,
          })
        }
      } else if (schedule.interval_type === "days" && schedule.last_completed_at) {
        const daysSinceLastMaintenance = Math.floor(
          (Date.now() - new Date(schedule.last_completed_at).getTime()) / (1000 * 60 * 60 * 24),
        )
        const daysUntilDue = schedule.interval_value - daysSinceLastMaintenance

        if (daysUntilDue <= 0) {
          overdueItems.push({
            name: schedule.name,
            message: `Overdue by ${Math.abs(daysUntilDue)} days`,
          })
        } else if (daysUntilDue <= schedule.interval_value * 0.2) {
          dueSoonItems.push({
            name: schedule.name,
            message: `Due in ${daysUntilDue} days`,
          })
        }
      }
    })

    if (overdueItems.length > 0) {
      return {
        status: "overdue",
        count: overdueItems.length,
        message: `${overdueItems.length} overdue`,
        items: overdueItems,
      }
    }
    if (dueSoonItems.length > 0) {
      return {
        status: "due-soon",
        count: dueSoonItems.length,
        message: `${dueSoonItems.length} due soon`,
        items: dueSoonItems,
      }
    }
    return null
  }

  const getFirearmBadgeColor = (type: string) => {
    switch (type) {
      case "rifle":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
      case "pistol":
        return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
      case "shotgun":
        return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
      case "revolver":
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    }
  }

  if (firearms.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No firearms found. Add your first firearm to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <TooltipProvider>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {firearms.map((firearm) => {
            const maintenanceStatus = getFirearmMaintenanceStatus(firearm)
            const firearmSchedules = maintenanceSchedules.filter((s) => s.firearm_id === firearm.id)
            const firearmHistory = maintenanceHistory.filter((h) => h.firearm_id === firearm.id)

            return (
              <Card
                key={firearm.id}
                className={`overflow-hidden ${maintenanceStatus?.status === "overdue" ? "border-red-500" : ""}`}
              >
                {firearm.image_url && (
                  <div
                    className="h-48 bg-cover bg-top relative -m-6 mb-0 rounded-t-lg"
                    style={{ backgroundImage: `url(${firearm.image_url})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{firearm.manufacturer}</CardTitle>
                      <CardDescription>{firearm.model}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant="outline" className={`capitalize ${getFirearmBadgeColor(firearm.type)}`}>
                        {firearm.type}
                      </Badge>
                      {maintenanceStatus && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={
                                maintenanceStatus.status === "overdue"
                                  ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800 cursor-help"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800 cursor-help"
                              }
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {maintenanceStatus.message}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-semibold text-sm">
                                {maintenanceStatus.status === "overdue" ? "Overdue Maintenance:" : "Due Soon:"}
                              </p>
                              {maintenanceStatus.items?.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-muted-foreground">{item.message}</p>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Caliber:</span>
                      <p className="font-medium">{firearm.caliber}</p>
                    </div>
                    {firearm.serial_number && (
                      <div>
                        <span className="text-muted-foreground">Serial:</span>
                        <p className="font-medium">{firearm.serial_number}</p>
                      </div>
                    )}
                    {firearm.barrel_length && (
                      <div>
                        <span className="text-muted-foreground">Barrel:</span>
                        <p className="font-medium">{firearm.barrel_length}"</p>
                      </div>
                    )}
                    {firearm.twist_rate && (
                      <div>
                        <span className="text-muted-foreground">Twist:</span>
                        <p className="font-medium">1:{firearm.twist_rate}"</p>
                      </div>
                    )}
                    {firearm.purchase_date && (
                      <div>
                        <span className="text-muted-foreground">Purchased:</span>
                        <p className="font-medium">{new Date(firearm.purchase_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Round Count:</span>
                      <p className="font-medium">{firearm.round_count.toLocaleString()}</p>
                    </div>
                  </div>
                  {firearm.notes && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Notes:</span>
                      <p className="mt-1">{firearm.notes}</p>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 pt-2">
                    <MaintenanceScheduleDialog
                      firearm={firearm}
                      schedules={firearmSchedules}
                      history={firearmHistory}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300 bg-transparent"
                        onClick={() => setEditingFirearm(firearm)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 bg-transparent"
                        onClick={() => setDeletingFirearm(firearm)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </TooltipProvider>

      {editingFirearm && (
        <EditFirearmDialog
          firearm={editingFirearm}
          open={!!editingFirearm}
          onOpenChange={(open) => !open && setEditingFirearm(null)}
        />
      )}

      {deletingFirearm && (
        <DeleteFirearmDialog
          firearm={deletingFirearm}
          open={!!deletingFirearm}
          onOpenChange={(open) => !open && setDeletingFirearm(null)}
        />
      )}
    </>
  )
}
