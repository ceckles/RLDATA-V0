"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DeleteAmmunitionBatchButton } from "@/components/delete-ammunition-batch-button"
import { EditAmmunitionBatchDialog } from "@/components/edit-ammunition-batch-dialog"
import { Pencil } from "lucide-react"
import { useState } from "react"

interface AmmunitionBatchCardProps {
  batch: any
  components: any[]
  preferences: any
}

export function AmmunitionBatchCard({ batch, components, preferences }: AmmunitionBatchCardProps) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {batch.batch_number}
                <Badge variant={batch.ammunition_type === "handload" ? "default" : "secondary"}>
                  {batch.ammunition_type === "handload" ? "Hand-Loaded" : "Factory"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {new Date(batch.date_produced).toLocaleDateString()} • {batch.caliber}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">{batch.quantity_remaining}</div>
                <div className="text-sm text-muted-foreground">of {batch.quantity} rounds</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <DeleteAmmunitionBatchButton batch={batch} components={components} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {batch.ammunition_type === "factory" ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Manufacturer:</span> {batch.factory_manufacturer}
              </div>
              <div>
                <span className="text-muted-foreground">Model:</span> {batch.factory_model}
              </div>
              {batch.factory_lot_number && (
                <div>
                  <span className="text-muted-foreground">Lot Number:</span> {batch.factory_lot_number}
                </div>
              )}
              {batch.cost_per_round && (
                <div>
                  <span className="text-muted-foreground">Cost per Round:</span> ${batch.cost_per_round.toFixed(3)}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {batch.charge_weight_grains && (
                <div>
                  <span className="text-muted-foreground">Charge Weight:</span> {batch.charge_weight_grains}gr
                </div>
              )}
              {batch.coal && (
                <div>
                  <span className="text-muted-foreground">COAL:</span> {batch.coal}"
                </div>
              )}
              {batch.seating_depth_ogive && (
                <div>
                  <span className="text-muted-foreground">Seating Depth:</span> {batch.seating_depth_ogive}"
                </div>
              )}
              {batch.cartridge_weight_grains && (
                <div>
                  <span className="text-muted-foreground">Cartridge Weight:</span> {batch.cartridge_weight_grains}gr
                </div>
              )}
              {batch.neck_tension && (
                <div>
                  <span className="text-muted-foreground">Neck Tension:</span> {batch.neck_tension}"
                </div>
              )}
              {batch.bushing_size && (
                <div>
                  <span className="text-muted-foreground">Bushing Size:</span> {batch.bushing_size}"
                </div>
              )}
              {batch.case_trim_length && (
                <div>
                  <span className="text-muted-foreground">Case Trim Length:</span> {batch.case_trim_length}"
                </div>
              )}
              {batch.primer_seating_depth && (
                <div>
                  <span className="text-muted-foreground">Primer Seating:</span> {batch.primer_seating_depth}"
                </div>
              )}
              {batch.crimp_type && (
                <div>
                  <span className="text-muted-foreground">Crimp Type:</span> {batch.crimp_type}
                </div>
              )}
              {batch.crimp_measurement && (
                <div>
                  <span className="text-muted-foreground">Crimp Measurement:</span> {batch.crimp_measurement}"
                </div>
              )}
              {batch.number_of_firings !== null && (
                <div>
                  <span className="text-muted-foreground">Firings:</span> {batch.number_of_firings}
                </div>
              )}
              {batch.cost_per_round && (
                <div>
                  <span className="text-muted-foreground">Cost per Round:</span> ${batch.cost_per_round.toFixed(3)}
                </div>
              )}
            </div>
          )}
          {batch.notes && <p className="mt-4 text-sm text-muted-foreground">{batch.notes}</p>}
        </CardContent>
      </Card>

      <EditAmmunitionBatchDialog batch={batch} preferences={preferences} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}
