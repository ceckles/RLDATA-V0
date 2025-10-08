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
import { Textarea } from "@/components/ui/textarea"
import type { ShootingSession } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface EditSessionDialogProps {
  session: ShootingSession
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSessionDialog({ session, open, onOpenChange }: EditSessionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    session_date: session.session_date,
    rounds_fired: session.rounds_fired.toString(),
    distance: session.distance?.toString() || "",
    temperature: session.temperature?.toString() || "",
    humidity: session.humidity?.toString() || "",
    wind_speed: session.wind_speed?.toString() || "",
    load_recipe: session.load_recipe || "",
    powder_charge: session.powder_charge?.toString() || "",
    group_size: session.group_size?.toString() || "",
    notes: session.notes || "",
  })

  useEffect(() => {
    if (open) {
      setFormData({
        session_date: session.session_date,
        rounds_fired: session.rounds_fired.toString(),
        distance: session.distance?.toString() || "",
        temperature: session.temperature?.toString() || "",
        humidity: session.humidity?.toString() || "",
        wind_speed: session.wind_speed?.toString() || "",
        load_recipe: session.load_recipe || "",
        powder_charge: session.powder_charge?.toString() || "",
        group_size: session.group_size?.toString() || "",
        notes: session.notes || "",
      })
    }
  }, [session, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("shooting_sessions")
        .update({
          session_date: formData.session_date,
          rounds_fired: Number.parseInt(formData.rounds_fired),
          distance: formData.distance ? Number.parseFloat(formData.distance) : null,
          temperature: formData.temperature ? Number.parseFloat(formData.temperature) : null,
          humidity: formData.humidity ? Number.parseFloat(formData.humidity) : null,
          wind_speed: formData.wind_speed ? Number.parseFloat(formData.wind_speed) : null,
          load_recipe: formData.load_recipe || null,
          powder_charge: formData.powder_charge ? Number.parseFloat(formData.powder_charge) : null,
          group_size: formData.group_size ? Number.parseFloat(formData.group_size) : null,
          notes: formData.notes || null,
        })
        .eq("id", session.id)

      if (error) throw error

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating session:", error)
      alert("Failed to update session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>Update session details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="session_date">Date *</Label>
                <Input
                  id="session_date"
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rounds_fired">Rounds Fired *</Label>
                <Input
                  id="rounds_fired"
                  type="number"
                  value={formData.rounds_fired}
                  onChange={(e) => setFormData({ ...formData, rounds_fired: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="distance">Distance (yards)</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="group_size">Group Size (inches)</Label>
                <Input
                  id="group_size"
                  type="number"
                  step="0.01"
                  value={formData.group_size}
                  onChange={(e) => setFormData({ ...formData, group_size: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="powder_charge">Powder Charge (gr)</Label>
                <Input
                  id="powder_charge"
                  type="number"
                  step="0.1"
                  value={formData.powder_charge}
                  onChange={(e) => setFormData({ ...formData, powder_charge: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="temperature">Temperature (°F)</Label>
                <Input
                  id="temperature"
                  type="number"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input
                  id="humidity"
                  type="number"
                  value={formData.humidity}
                  onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wind_speed">Wind Speed (mph)</Label>
                <Input
                  id="wind_speed"
                  type="number"
                  step="0.1"
                  value={formData.wind_speed}
                  onChange={(e) => setFormData({ ...formData, wind_speed: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="load_recipe">Load Recipe</Label>
              <Input
                id="load_recipe"
                value={formData.load_recipe}
                onChange={(e) => setFormData({ ...formData, load_recipe: e.target.value })}
              />
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
