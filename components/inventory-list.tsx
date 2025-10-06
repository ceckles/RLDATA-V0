"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Component } from "@/lib/types"
import { Edit, Trash2, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { EditComponentDialog } from "./edit-component-dialog"
import { DeleteComponentDialog } from "./delete-component-dialog"

interface InventoryListProps {
  components: Component[]
}

export function InventoryList({ components }: InventoryListProps) {
  const [editingComponent, setEditingComponent] = useState<Component | null>(null)
  const [deletingComponent, setDeletingComponent] = useState<Component | null>(null)

  const getComponentBadgeColor = (type: string) => {
    switch (type) {
      case "primer":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
      case "powder":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
      case "bullet":
        return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
      case "brass":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    }
  }

  if (components.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No components found. Add your first component to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {components.map((component) => {
          const isLowStock = component.low_stock_threshold && component.quantity <= component.low_stock_threshold

          return (
            <Card key={component.id} className={isLowStock ? "border-orange-500" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{component.manufacturer}</CardTitle>
                    <CardDescription>{component.model}</CardDescription>
                  </div>
                  <Badge variant="outline" className={`capitalize ${getComponentBadgeColor(component.type)}`}>
                    {component.type}
                  </Badge>
                </div>
                {isLowStock && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Low Stock Alert</AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {component.caliber && (
                    <div>
                      <span className="text-muted-foreground">Caliber:</span>
                      <p className="font-medium">{component.caliber}</p>
                    </div>
                  )}
                  {component.weight && (
                    <div>
                      <span className="text-muted-foreground">Weight:</span>
                      <p className="font-medium">
                        {component.weight}{" "}
                        {component.type === "powder" && component.weight_unit ? component.weight_unit : "gr"}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">
                      {component.type === "powder" ? "Amount:" : "Quantity:"}
                    </span>
                    <p className="font-medium">
                      {component.quantity}
                      {component.type === "powder" && component.weight_unit ? ` ${component.weight_unit}` : ""}
                    </p>
                  </div>
                  {component.cost_per_unit && (
                    <div>
                      <span className="text-muted-foreground">Cost/Unit:</span>
                      <p className="font-medium">${component.cost_per_unit.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                {component.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1">{component.notes}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300 bg-transparent"
                    onClick={() => setEditingComponent(component)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 bg-transparent"
                    onClick={() => setDeletingComponent(component)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {editingComponent && (
        <EditComponentDialog
          component={editingComponent}
          open={!!editingComponent}
          onOpenChange={(open) => !open && setEditingComponent(null)}
        />
      )}

      {deletingComponent && (
        <DeleteComponentDialog
          component={deletingComponent}
          open={!!deletingComponent}
          onOpenChange={(open) => !open && setDeletingComponent(null)}
        />
      )}
    </>
  )
}
