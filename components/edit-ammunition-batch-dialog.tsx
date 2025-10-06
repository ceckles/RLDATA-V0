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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { UserTrackingPreferences } from "@/lib/types"
import { toast } from "sonner"

interface EditAmmunitionBatchDialogProps {
  batch: any
  preferences: UserTrackingPreferences | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditAmmunitionBatchDialog({ batch, preferences, open, onOpenChange }: EditAmmunitionBatchDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    batch_number: batch.batch_number || "",
    date_produced: batch.date_produced || "",
    caliber: batch.caliber || "",
    quantity: batch.quantity?.toString() || "",
    factory_manufacturer: batch.factory_manufacturer || "",
    factory_model: batch.factory_model || "",
    factory_lot_number: batch.factory_lot_number || "",
    charge_weight_grains: batch.charge_weight_grains?.toString() || "",
    coal: batch.coal?.toString() || "",
    seating_depth_ogive: batch.seating_depth_ogive?.toString() || "",
    cartridge_weight_grains: batch.cartridge_weight_grains?.toString() || "",
    neck_tension: batch.neck_tension?.toString() || "",
    bushing_size: batch.bushing_size?.toString() || "",
    case_trim_length: batch.case_trim_length?.toString() || "",
    primer_seating_depth: batch.primer_seating_depth?.toString() || "",
    crimp_type: batch.crimp_type || "",
    crimp_measurement: batch.crimp_measurement?.toString() || "",
    number_of_firings: batch.number_of_firings?.toString() || "0",
    total_cost: batch.total_cost?.toString() || "",
    notes: batch.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      const quantity = Number.parseInt(formData.quantity)
      const totalCost = formData.total_cost ? Number.parseFloat(formData.total_cost) : null
      const costPerRound = totalCost ? totalCost / quantity : null

      const updateData: any = {
        batch_number: formData.batch_number,
        date_produced: formData.date_produced,
        caliber: formData.caliber,
        quantity,
        cost_per_round: costPerRound,
        total_cost: totalCost,
        notes: formData.notes || null,
        charge_weight_grains: formData.charge_weight_grains ? Number.parseFloat(formData.charge_weight_grains) : null,
        coal: formData.coal ? Number.parseFloat(formData.coal) : null,
        seating_depth_ogive: formData.seating_depth_ogive ? Number.parseFloat(formData.seating_depth_ogive) : null,
        cartridge_weight_grains: formData.cartridge_weight_grains
          ? Number.parseFloat(formData.cartridge_weight_grains)
          : null,
        neck_tension: formData.neck_tension ? Number.parseFloat(formData.neck_tension) : null,
        bushing_size: formData.bushing_size ? Number.parseFloat(formData.bushing_size) : null,
        case_trim_length: formData.case_trim_length ? Number.parseFloat(formData.case_trim_length) : null,
        primer_seating_depth: formData.primer_seating_depth ? Number.parseFloat(formData.primer_seating_depth) : null,
        crimp_type: formData.crimp_type || null,
        crimp_measurement: formData.crimp_measurement ? Number.parseFloat(formData.crimp_measurement) : null,
        number_of_firings: formData.number_of_firings ? Number.parseInt(formData.number_of_firings) : 0,
      }

      if (batch.ammunition_type === "factory") {
        updateData.factory_manufacturer = formData.factory_manufacturer
        updateData.factory_model = formData.factory_model
        updateData.factory_lot_number = formData.factory_lot_number || null
      }

      const { error } = await supabase.from("ammunition_batches").update(updateData).eq("id", batch.id)

      if (error) {
        console.error("[v0] Database error:", error)
        throw error
      }

      toast.success("Ammunition batch updated successfully")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating ammunition batch:", error)
      toast.error("Failed to update ammunition batch")
    } finally {
      setIsLoading(false)
    }
  }

  const costPerRound =
    formData.total_cost && formData.quantity
      ? (Number.parseFloat(formData.total_cost) / Number.parseInt(formData.quantity)).toFixed(3)
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Ammunition Batch</DialogTitle>
          <DialogDescription>Update batch information and measurements</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="batch_number">Batch Number *</Label>
                <Input
                  id="batch_number"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date_produced">Date Produced *</Label>
                <Input
                  id="date_produced"
                  type="date"
                  value={formData.date_produced}
                  onChange={(e) => setFormData({ ...formData, date_produced: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="caliber">Caliber *</Label>
                <Input
                  id="caliber"
                  value={formData.caliber}
                  onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Total Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Remaining: {batch.quantity_remaining} rounds</p>
              </div>
            </div>

            {batch.ammunition_type === "factory" ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="factory_manufacturer">Manufacturer *</Label>
                  <Input
                    id="factory_manufacturer"
                    value={formData.factory_manufacturer}
                    onChange={(e) => setFormData({ ...formData, factory_manufacturer: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="factory_model">Model/Product Name *</Label>
                  <Input
                    id="factory_model"
                    value={formData.factory_model}
                    onChange={(e) => setFormData({ ...formData, factory_model: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="factory_lot_number">Lot Number</Label>
                  <Input
                    id="factory_lot_number"
                    value={formData.factory_lot_number}
                    onChange={(e) => setFormData({ ...formData, factory_lot_number: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                {preferences?.track_charge_weight && (
                  <div className="grid gap-2">
                    <Label htmlFor="charge_weight_grains">Charge Weight (grains)</Label>
                    <Input
                      id="charge_weight_grains"
                      type="number"
                      step="0.1"
                      value={formData.charge_weight_grains}
                      onChange={(e) => setFormData({ ...formData, charge_weight_grains: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {preferences?.track_coal && (
                    <div className="grid gap-2">
                      <Label htmlFor="coal">COAL (inches)</Label>
                      <Input
                        id="coal"
                        type="number"
                        step="0.001"
                        value={formData.coal}
                        onChange={(e) => setFormData({ ...formData, coal: e.target.value })}
                      />
                    </div>
                  )}
                  {preferences?.track_seating_depth_ogive && (
                    <div className="grid gap-2">
                      <Label htmlFor="seating_depth_ogive">Seating Depth (inches)</Label>
                      <Input
                        id="seating_depth_ogive"
                        type="number"
                        step="0.001"
                        value={formData.seating_depth_ogive}
                        onChange={(e) => setFormData({ ...formData, seating_depth_ogive: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {preferences?.track_cartridge_weight && (
                    <div className="grid gap-2">
                      <Label htmlFor="cartridge_weight_grains">Cartridge Weight (grains)</Label>
                      <Input
                        id="cartridge_weight_grains"
                        type="number"
                        step="0.1"
                        value={formData.cartridge_weight_grains}
                        onChange={(e) => setFormData({ ...formData, cartridge_weight_grains: e.target.value })}
                      />
                    </div>
                  )}
                  {preferences?.track_neck_tension && (
                    <div className="grid gap-2">
                      <Label htmlFor="neck_tension">Neck Tension (inches)</Label>
                      <Input
                        id="neck_tension"
                        type="number"
                        step="0.001"
                        value={formData.neck_tension}
                        onChange={(e) => setFormData({ ...formData, neck_tension: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {preferences?.track_bushing_size && (
                  <div className="grid gap-2">
                    <Label htmlFor="bushing_size">Bushing Size (inches)</Label>
                    <Input
                      id="bushing_size"
                      type="number"
                      step="0.001"
                      value={formData.bushing_size}
                      onChange={(e) => setFormData({ ...formData, bushing_size: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {preferences?.track_case_trim_length && (
                    <div className="grid gap-2">
                      <Label htmlFor="case_trim_length">Case Trim Length (inches)</Label>
                      <Input
                        id="case_trim_length"
                        type="number"
                        step="0.001"
                        value={formData.case_trim_length}
                        onChange={(e) => setFormData({ ...formData, case_trim_length: e.target.value })}
                      />
                    </div>
                  )}
                  {preferences?.track_primer_seating_depth && (
                    <div className="grid gap-2">
                      <Label htmlFor="primer_seating_depth">Primer Seating (inches)</Label>
                      <Input
                        id="primer_seating_depth"
                        type="number"
                        step="0.001"
                        value={formData.primer_seating_depth}
                        onChange={(e) => setFormData({ ...formData, primer_seating_depth: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {preferences?.track_crimp_type && (
                    <div className="grid gap-2">
                      <Label htmlFor="crimp_type">Crimp Type</Label>
                      <Select
                        value={formData.crimp_type}
                        onValueChange={(value) => setFormData({ ...formData, crimp_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select crimp type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="roll">Roll</SelectItem>
                          <SelectItem value="taper">Taper</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {preferences?.track_crimp_measurement && (
                    <div className="grid gap-2">
                      <Label htmlFor="crimp_measurement">Crimp Measurement (inches)</Label>
                      <Input
                        id="crimp_measurement"
                        type="number"
                        step="0.001"
                        value={formData.crimp_measurement}
                        onChange={(e) => setFormData({ ...formData, crimp_measurement: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {preferences?.track_number_of_firings && (
                  <div className="grid gap-2">
                    <Label htmlFor="number_of_firings">Number of Firings</Label>
                    <Input
                      id="number_of_firings"
                      type="number"
                      value={formData.number_of_firings}
                      onChange={(e) => setFormData({ ...formData, number_of_firings: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="total_cost">Cost</Label>
              <div className="space-y-2">
                <Input
                  id="total_cost"
                  type="number"
                  step="0.01"
                  value={formData.total_cost}
                  onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                  placeholder="Total cost"
                />
                {costPerRound && (
                  <Input type="text" value={`$${costPerRound} per round`} disabled className="bg-muted font-medium" />
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
