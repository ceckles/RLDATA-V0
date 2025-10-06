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
import type { Component } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface EditComponentDialogProps {
  component: Component
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditComponentDialog({ component, open, onOpenChange }: EditComponentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    manufacturer: component.manufacturer,
    model: component.model,
    primer_type: (component as any).primer_type || "",
    powder_category: (component as any).powder_category || "",
    powder_type: (component as any).powder_type || "",
    weight_unit: (component as any).weight_unit || "lb",
    caliber: component.caliber || "",
    weight: component.weight?.toString() || "",
    quantity: component.quantity.toString(),
    price_paid: (component as any).price_paid?.toString() || "",
    low_stock_threshold: component.low_stock_threshold?.toString() || "",
    lot_number: component.lot_number || "",
    purchase_date: component.purchase_date || "",
    notes: component.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      const quantity =
        component.type === "powder"
          ? formData.weight
            ? Number.parseFloat(formData.weight)
            : 0
          : Number.parseInt(formData.quantity)

      const pricePaid = formData.price_paid ? Number.parseFloat(formData.price_paid) : null
      const costPerUnit = pricePaid && quantity > 0 ? pricePaid / quantity : null

      const { error } = await supabase
        .from("components")
        .update({
          manufacturer: formData.manufacturer,
          model: formData.model,
          primer_type: component.type === "primer" ? formData.primer_type || null : null,
          powder_category: component.type === "powder" ? formData.powder_category || null : null,
          powder_type: component.type === "powder" ? formData.powder_type || null : null,
          weight_unit: component.type === "powder" ? formData.weight_unit || null : null,
          caliber: component.type === "bullet" || component.type === "brass" ? formData.caliber || null : null,
          weight: formData.weight ? Number.parseFloat(formData.weight) : null,
          quantity: quantity,
          price_paid: pricePaid,
          cost_per_unit: costPerUnit,
          low_stock_threshold: formData.low_stock_threshold ? Number.parseFloat(formData.low_stock_threshold) : null,
          lot_number: formData.lot_number || null,
          purchase_date: formData.purchase_date || null,
          notes: formData.notes || null,
        })
        .eq("id", component.id)

      if (error) throw error

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating component:", error)
      alert("Failed to update component. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Component</DialogTitle>
          <DialogDescription>Update component details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>
            </div>

            {component.type === "primer" ? (
              <div className="grid gap-2">
                <Label htmlFor="primer_type">Primer Type *</Label>
                <Select
                  value={formData.primer_type}
                  onValueChange={(value) => setFormData({ ...formData, primer_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small Pistol (SP)">Small Pistol (SP)</SelectItem>
                    <SelectItem value="Large Pistol (LP)">Large Pistol (LP)</SelectItem>
                    <SelectItem value="Small Pistol Magnum (SPM)">Small Pistol Magnum (SPM)</SelectItem>
                    <SelectItem value="Large Pistol Magnum (LPM)">Large Pistol Magnum (LPM)</SelectItem>
                    <SelectItem value="Small Rifle (SR)">Small Rifle (SR)</SelectItem>
                    <SelectItem value="Large Rifle (LR)">Large Rifle (LR)</SelectItem>
                    <SelectItem value="Small Rifle Magnum (SRM)">Small Rifle Magnum (SRM)</SelectItem>
                    <SelectItem value="Large Rifle Magnum (LRM)">Large Rifle Magnum (LRM)</SelectItem>
                    <SelectItem value="209 Shotshell">209 Shotshell</SelectItem>
                    <SelectItem value="Boxer">Boxer</SelectItem>
                    <SelectItem value="Berdan">Berdan</SelectItem>
                    <SelectItem value="Match">Match</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : component.type === "powder" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="powder_category">Category *</Label>
                    <Select
                      value={formData.powder_category}
                      onValueChange={(value) => setFormData({ ...formData, powder_category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pistol">Pistol</SelectItem>
                        <SelectItem value="Rifle">Rifle</SelectItem>
                        <SelectItem value="Shotgun">Shotgun</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="powder_type">Powder Type *</Label>
                    <Select
                      value={formData.powder_type}
                      onValueChange={(value) => setFormData({ ...formData, powder_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Black powder (granulated)">Black powder (granulated)</SelectItem>
                        <SelectItem value="Black powder substitute (e.g., Pyrodex)">
                          Black powder substitute (e.g., Pyrodex)
                        </SelectItem>
                        <SelectItem value="Smokeless — Single-base">Smokeless — Single-base</SelectItem>
                        <SelectItem value="Smokeless — Double-base">Smokeless — Double-base</SelectItem>
                        <SelectItem value="Smokeless — Triple-base">Smokeless — Triple-base</SelectItem>
                        <SelectItem value="Ball (spherical)">Ball (spherical)</SelectItem>
                        <SelectItem value="Flake (flattened)">Flake (flattened)</SelectItem>
                        <SelectItem value="Extruded / Stick / Tubular (cylindrical)">
                          Extruded / Stick / Tubular (cylindrical)
                        </SelectItem>
                        <SelectItem value="Coated (surface-coated powders)">Coated (surface-coated powders)</SelectItem>
                        <SelectItem value="Reduced / Progressive (temperature-sensitive burn rate powders)">
                          Reduced / Progressive (temperature-sensitive)
                        </SelectItem>
                        <SelectItem value="Pelletized (muzzleloader pellets)">
                          Pelletized (muzzleloader pellets)
                        </SelectItem>
                        <SelectItem value="Composite / Nitrocellulose blends">
                          Composite / Nitrocellulose blends
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="weight">Weight *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="weight_unit">Unit *</Label>
                    <Select
                      value={formData.weight_unit}
                      onValueChange={(value) => setFormData({ ...formData, weight_unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lb">Pounds (lb)</SelectItem>
                        <SelectItem value="g">Grams (g)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="caliber">Caliber</Label>
                <Input
                  id="caliber"
                  value={formData.caliber}
                  onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                />
              </div>
            )}

            {component.type === "bullet" && (
              <div className="grid gap-2">
                <Label htmlFor="weight">Weight (grains)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {component.type !== "powder" && (
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
              )}
              <div className="grid gap-2">
                <Label htmlFor="price_paid">Price Paid</Label>
                <Input
                  id="price_paid"
                  type="number"
                  step="0.01"
                  value={formData.price_paid}
                  onChange={(e) => setFormData({ ...formData, price_paid: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="low_stock_threshold">
                Low Stock Alert Threshold
                {component.type === "powder" && formData.weight_unit && ` (${formData.weight_unit})`}
              </Label>
              <Input
                id="low_stock_threshold"
                type="number"
                step="0.1"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lot_number">Lot Number</Label>
                <Input
                  id="lot_number"
                  value={formData.lot_number}
                  onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
