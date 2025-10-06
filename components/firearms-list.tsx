"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Firearm } from "@/lib/types"
import { Edit, Trash2 } from "lucide-react"
import { useState } from "react"
import { EditFirearmDialog } from "./edit-firearm-dialog"
import { DeleteFirearmDialog } from "./delete-firearm-dialog"
import { MaintenanceScheduleDialog } from "./maintenance-schedule-dialog"

interface FirearmsListProps {
  firearms: Firearm[]
}

export function FirearmsList({ firearms }: FirearmsListProps) {
  const [editingFirearm, setEditingFirearm] = useState<Firearm | null>(null)
  const [deletingFirearm, setDeletingFirearm] = useState<Firearm | null>(null)

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {firearms.map((firearm) => (
          <Card key={firearm.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{firearm.manufacturer}</CardTitle>
                  <CardDescription>{firearm.model}</CardDescription>
                </div>
                <Badge variant="outline" className={`capitalize ${getFirearmBadgeColor(firearm.type)}`}>
                  {firearm.type}
                </Badge>
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
                <MaintenanceScheduleDialog firearm={firearm} schedules={[]} />
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
        ))}
      </div>

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
