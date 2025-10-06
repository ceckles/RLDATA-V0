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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import type { Component, UserTrackingPreferences } from "@/lib/types"
import { toast } from "sonner"

interface AddAmmunitionBatchDialogProps {
  userId: string
  components: Component[]
  preferences: UserTrackingPreferences | null
  trigger?: React.ReactNode
}

export function AddAmmunitionBatchDialog({ userId, components, preferences, trigger }: AddAmmunitionBatchDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ammunitionType, setAmmunitionType] = useState<"handload" | "factory">("handload")
  const router = useRouter()

  const primers = components.filter((c) => c.type === "primer")
  const powders = components.filter((c) => c.type === "powder")
  const bullets = components.filter((c) => c.type === "bullet")
  const brass = components.filter((c) => c.type === "brass")

  const [formData, setFormData] = useState({
    batch_number: `BATCH-${Date.now()}`,
    date_produced: new Date().toISOString().split("T")[0],
    caliber: "",
    quantity: "",

    // Factory fields
    factory_manufacturer: "",
    factory_model: "",
    factory_lot_number: "",

    // Handload fields
    primer_id: "",
    powder_id: "",
    bullet_id: "",
    brass_id: "",

    // Measurements
    charge_weight_grains: "",
    coal: "",
    seating_depth_ogive: "",
    cartridge_weight_grains: "",
    neck_tension: "",
    bushing_size: "",
    case_trim_length: "",
    primer_seating_depth: "",
    crimp_type: "",
    crimp_measurement: "",
    number_of_firings: "0",

    // Cost
    total_cost: "",

    notes: "",
  })

  const calculateHandloadCost = () => {
    if (ammunitionType !== "handload") return null

    const quantity = Number.parseInt(formData.quantity) || 0
    if (quantity === 0) return null

    let totalCost = 0

    // Primer cost
    if (formData.primer_id) {
      const primer = primers.find((p) => p.id === formData.primer_id)
      if (primer?.cost_per_unit) {
        totalCost += primer.cost_per_unit * quantity
      }
    }

    // Powder cost
    if (formData.powder_id && formData.charge_weight_grains) {
      const powder = powders.find((p) => p.id === formData.powder_id)
      if (powder?.cost_per_unit && powder.weight) {
        const chargeWeight = Number.parseFloat(formData.charge_weight_grains)
        // Calculate cost per grain based on container weight unit
        let costPerGrain = 0
        if (powder.weight_unit === "lb") {
          costPerGrain = powder.cost_per_unit / (powder.weight * 7000)
        } else if (powder.weight_unit === "kg") {
          costPerGrain = powder.cost_per_unit / (powder.weight * 15432.4)
        }
        totalCost += costPerGrain * chargeWeight * quantity
      }
    }

    // Bullet cost
    if (formData.bullet_id) {
      const bullet = bullets.find((b) => b.id === formData.bullet_id)
      if (bullet?.cost_per_unit) {
        totalCost += bullet.cost_per_unit * quantity
      }
    }

    // Brass cost
    if (formData.brass_id) {
      const brassItem = brass.find((b) => b.id === formData.brass_id)
      if (brassItem?.cost_per_unit) {
        totalCost += brassItem.cost_per_unit * quantity
      }
    }

    return totalCost > 0 ? totalCost : null
  }

  useEffect(() => {
    if (ammunitionType === "handload") {
      const calculatedCost = calculateHandloadCost()
      if (calculatedCost !== null) {
        setFormData((prev) => ({ ...prev, total_cost: calculatedCost.toFixed(2) }))
      }
    }
  }, [
    ammunitionType,
    formData.quantity,
    formData.primer_id,
    formData.powder_id,
    formData.bullet_id,
    formData.brass_id,
    formData.charge_weight_grains,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      const quantity = Number.parseInt(formData.quantity)
      const totalCost = formData.total_cost ? Number.parseFloat(formData.total_cost) : null
      const costPerRound = totalCost ? totalCost / quantity : null

      const batchData: any = {
        user_id: userId,
        batch_number: formData.batch_number,
        date_produced: formData.date_produced,
        caliber: formData.caliber,
        quantity,
        quantity_remaining: quantity,
        ammunition_type: ammunitionType,
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

      if (ammunitionType === "factory") {
        batchData.factory_manufacturer = formData.factory_manufacturer
        batchData.factory_model = formData.factory_model
        batchData.factory_lot_number = formData.factory_lot_number || null
      } else {
        // Handload data
        batchData.primer_id = formData.primer_id || null
        batchData.powder_id = formData.powder_id || null
        batchData.bullet_id = formData.bullet_id || null
        batchData.brass_id = formData.brass_id || null

        // Deduct components from inventory
        const updates = []

        if (formData.primer_id) {
          const primer = primers.find((p) => p.id === formData.primer_id)
          if (primer) {
            updates.push(
              supabase
                .from("components")
                .update({ quantity: Math.max(0, primer.quantity - quantity) })
                .eq("id", formData.primer_id),
            )
          }
        }

        if (formData.powder_id && formData.charge_weight_grains) {
          const powder = powders.find((p) => p.id === formData.powder_id)
          if (powder) {
            const chargeWeight = Number.parseFloat(formData.charge_weight_grains)
            const totalPowderUsed =
              powder.weight_unit === "lb" ? (chargeWeight * quantity) / 7000 : (chargeWeight * quantity) / 15.432

            updates.push(
              supabase
                .from("components")
                .update({ quantity: Math.max(0, powder.quantity - totalPowderUsed) })
                .eq("id", formData.powder_id),
            )
          }
        }

        if (formData.bullet_id) {
          const bullet = bullets.find((b) => b.id === formData.bullet_id)
          if (bullet) {
            updates.push(
              supabase
                .from("components")
                .update({ quantity: Math.max(0, bullet.quantity - quantity) })
                .eq("id", formData.bullet_id),
            )
          }
        }

        if (formData.brass_id) {
          const brassItem = brass.find((b) => b.id === formData.brass_id)
          if (brassItem) {
            updates.push(
              supabase
                .from("components")
                .update({ quantity: Math.max(0, brassItem.quantity - quantity) })
                .eq("id", formData.brass_id),
            )
          }
        }

        await Promise.all(updates)
      }

      const { error } = await supabase.from("ammunition_batches").insert(batchData)

      if (error) {
        console.error("[v0] Database error:", error)
        throw error
      }

      toast.success("Ammunition batch added successfully")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error adding ammunition batch:", error)
      toast.error("Failed to add ammunition batch")
    } finally {
      setIsLoading(false)
    }
  }

  const costPerRound =
    formData.total_cost && formData.quantity
      ? (Number.parseFloat(formData.total_cost) / Number.parseInt(formData.quantity)).toFixed(3)
      : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Ammunition Batch
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Ammunition Batch</DialogTitle>
          <DialogDescription>Track hand-loaded or factory ammunition</DialogDescription>
        </DialogHeader>

        <Tabs value={ammunitionType} onValueChange={(v) => setAmmunitionType(v as "handload" | "factory")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="handload">Hand-Loaded</TabsTrigger>
            <TabsTrigger value="factory">Factory</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="handload" className="space-y-4">
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
                  <Label htmlFor="caliber">Caliber</Label>
                  <Input
                    id="caliber"
                    value={formData.caliber}
                    disabled
                    placeholder="Select bullet to auto-fill"
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Auto-filled from bullet selection</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="primer_id">Primer</Label>
                <Select
                  value={formData.primer_id}
                  onValueChange={(value) => setFormData({ ...formData, primer_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primer" />
                  </SelectTrigger>
                  <SelectContent>
                    {primers.map((primer) => (
                      <SelectItem key={primer.id} value={primer.id}>
                        {primer.manufacturer} {primer.model} ({primer.quantity} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="powder_id">Powder</Label>
                  <Select
                    value={formData.powder_id}
                    onValueChange={(value) => setFormData({ ...formData, powder_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select powder" />
                    </SelectTrigger>
                    <SelectContent>
                      {powders.map((powder) => (
                        <SelectItem key={powder.id} value={powder.id}>
                          {powder.manufacturer} {powder.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bullet_id">Bullet</Label>
                <Select
                  value={formData.bullet_id}
                  onValueChange={(value) => {
                    const selectedBullet = bullets.find((b) => b.id === value)
                    setFormData({
                      ...formData,
                      bullet_id: value,
                      caliber: selectedBullet?.caliber || formData.caliber,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bullet" />
                  </SelectTrigger>
                  <SelectContent>
                    {bullets.map((bullet) => (
                      <SelectItem key={bullet.id} value={bullet.id}>
                        {bullet.manufacturer} {bullet.model} - {bullet.weight}gr ({bullet.caliber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="brass_id">Brass</Label>
                <Select
                  value={formData.brass_id}
                  onValueChange={(value) => setFormData({ ...formData, brass_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brass" />
                  </SelectTrigger>
                  <SelectContent>
                    {brass.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.manufacturer} {b.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Detailed measurements based on preferences */}
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
                      placeholder="2.800"
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
                    placeholder="0.336"
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
                      placeholder="0.003"
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

              <div className="grid gap-2">
                <Label htmlFor="total_cost">Cost Breakdown</Label>
                <div className="space-y-2">
                  <Input
                    id="total_cost"
                    type="text"
                    value={formData.total_cost ? `$${formData.total_cost}` : "Select components to calculate"}
                    disabled
                    className="bg-muted"
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
                  placeholder="Additional notes about this batch..."
                />
              </div>
            </TabsContent>

            <TabsContent value="factory" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="batch_number_factory">Batch Number *</Label>
                  <Input
                    id="batch_number_factory"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date_produced_factory">Date Purchased *</Label>
                  <Input
                    id="date_produced_factory"
                    type="date"
                    value={formData.date_produced}
                    onChange={(e) => setFormData({ ...formData, date_produced: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="factory_manufacturer">Manufacturer *</Label>
                <Input
                  id="factory_manufacturer"
                  value={formData.factory_manufacturer}
                  onChange={(e) => setFormData({ ...formData, factory_manufacturer: e.target.value })}
                  placeholder="Federal, Hornady, etc."
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="factory_model">Model/Product Name *</Label>
                <Input
                  id="factory_model"
                  value={formData.factory_model}
                  onChange={(e) => setFormData({ ...formData, factory_model: e.target.value })}
                  placeholder="Gold Medal Match, etc."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="caliber_factory">Caliber *</Label>
                  <Input
                    id="caliber_factory"
                    value={formData.caliber}
                    onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                    placeholder=".308 Win, 9mm, etc."
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity_factory">Quantity *</Label>
                  <Input
                    id="quantity_factory"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="factory_lot_number">Lot Number</Label>
                <Input
                  id="factory_lot_number"
                  value={formData.factory_lot_number}
                  onChange={(e) => setFormData({ ...formData, factory_lot_number: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="total_cost_factory">Total Cost ($)</Label>
                <Input
                  id="total_cost_factory"
                  type="number"
                  step="0.01"
                  value={formData.total_cost}
                  onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                  placeholder="25.00"
                />
                {costPerRound && <p className="text-sm text-muted-foreground">Cost per round: ${costPerRound}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes_factory">Notes</Label>
                <Textarea
                  id="notes_factory"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </TabsContent>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Batch"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
