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
import { createClient } from "@/lib/supabase/client"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Component } from "@/lib/types"

interface AddReloadingSessionDialogProps {
  userId: string
  components: Component[]
  trigger?: React.ReactNode
}

export function AddReloadingSessionDialog({ userId, components, trigger }: AddReloadingSessionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const primers = components.filter((c) => c.type === "primer")
  const powders = components.filter((c) => c.type === "powder")
  const bullets = components.filter((c) => c.type === "bullet")
  const brass = components.filter((c) => c.type === "brass")

  const [formData, setFormData] = useState({
    session_date: new Date().toISOString().split("T")[0],
    caliber: "",
    primer_id: "",
    powder_id: "",
    powder_charge_grains: "",
    bullet_id: "",
    brass_id: "",
    rounds_loaded: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      const primerComponent = primers.find((p) => p.id === formData.primer_id)
      const powderComponent = powders.find((p) => p.id === formData.powder_id)
      const bulletComponent = bullets.find((b) => b.id === formData.bullet_id)
      const brassComponent = brass.find((b) => b.id === formData.brass_id)

      const { error } = await supabase.from("reloading_sessions").insert({
        user_id: userId,
        session_date: formData.session_date,
        caliber: formData.caliber,
        primer_id: formData.primer_id || null,
        primer_used: primerComponent ? `${primerComponent.manufacturer} ${primerComponent.model}` : null,
        powder_id: formData.powder_id || null,
        powder_used: powderComponent ? `${powderComponent.manufacturer} ${powderComponent.model}` : null,
        powder_charge_grains: formData.powder_charge_grains ? Number.parseFloat(formData.powder_charge_grains) : null,
        bullet_id: formData.bullet_id || null,
        bullet_used: bulletComponent ? `${bulletComponent.manufacturer} ${bulletComponent.model}` : null,
        brass_id: formData.brass_id || null,
        brass_used: brassComponent ? `${brassComponent.manufacturer} ${brassComponent.model}` : null,
        rounds_loaded: Number.parseInt(formData.rounds_loaded),
        notes: formData.notes || null,
      })

      if (error) throw error

      // Update component quantities
      const roundsLoaded = Number.parseInt(formData.rounds_loaded)
      const powderCharge = formData.powder_charge_grains ? Number.parseFloat(formData.powder_charge_grains) : 0

      const updates = []

      if (formData.primer_id && primerComponent) {
        updates.push(
          supabase
            .from("components")
            .update({ quantity: Math.max(0, primerComponent.quantity - roundsLoaded) })
            .eq("id", formData.primer_id),
        )
      }

      if (formData.powder_id && powderComponent) {
        // Convert grains to pounds or grams based on the powder's weight_unit
        const totalPowderUsed =
          powderComponent.weight_unit === "lb"
            ? (powderCharge * roundsLoaded) / 7000 // 7000 grains = 1 pound
            : (powderCharge * roundsLoaded) / 15.432 // 15.432 grains = 1 gram

        updates.push(
          supabase
            .from("components")
            .update({ quantity: Math.max(0, powderComponent.quantity - totalPowderUsed) })
            .eq("id", formData.powder_id),
        )
      }

      if (formData.bullet_id && bulletComponent) {
        updates.push(
          supabase
            .from("components")
            .update({ quantity: Math.max(0, bulletComponent.quantity - roundsLoaded) })
            .eq("id", formData.bullet_id),
        )
      }

      if (formData.brass_id && brassComponent) {
        updates.push(
          supabase
            .from("components")
            .update({ quantity: Math.max(0, brassComponent.quantity - roundsLoaded) })
            .eq("id", formData.brass_id),
        )
      }

      await Promise.all(updates)

      setOpen(false)
      setFormData({
        session_date: new Date().toISOString().split("T")[0],
        caliber: "",
        primer_id: "",
        powder_id: "",
        powder_charge_grains: "",
        bullet_id: "",
        brass_id: "",
        rounds_loaded: "",
        notes: "",
      })
      router.refresh()
    } catch (error) {
      console.error("Error adding reloading session:", error)
      alert("Failed to add reloading session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Reloading Session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Reloading Session</DialogTitle>
          <DialogDescription>Record ammunition creation from your components</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="session_date">Session Date *</Label>
                <Input
                  id="session_date"
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="caliber">Caliber *</Label>
                <Input
                  id="caliber"
                  value={formData.caliber}
                  onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                  placeholder=".308 Win, 9mm, etc."
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="primer_id">Primer *</Label>
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
                <Label htmlFor="powder_id">Powder *</Label>
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
                        {powder.manufacturer} {powder.model} ({powder.quantity} {powder.weight_unit} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="powder_charge_grains">Powder Charge (grains) *</Label>
                <Input
                  id="powder_charge_grains"
                  type="number"
                  step="0.1"
                  value={formData.powder_charge_grains}
                  onChange={(e) => setFormData({ ...formData, powder_charge_grains: e.target.value })}
                  placeholder="42.5"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bullet_id">Bullet *</Label>
              <Select
                value={formData.bullet_id}
                onValueChange={(value) => setFormData({ ...formData, bullet_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bullet" />
                </SelectTrigger>
                <SelectContent>
                  {bullets.map((bullet) => (
                    <SelectItem key={bullet.id} value={bullet.id}>
                      {bullet.manufacturer} {bullet.model} - {bullet.weight}gr ({bullet.quantity} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="brass_id">Brass *</Label>
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
                      {b.manufacturer} {b.model} ({b.quantity} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rounds_loaded">Rounds Loaded *</Label>
              <Input
                id="rounds_loaded"
                type="number"
                value={formData.rounds_loaded}
                onChange={(e) => setFormData({ ...formData, rounds_loaded: e.target.value })}
                placeholder="50"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes about this reloading session..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Logging..." : "Log Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
