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
import { TierLimitAlert } from "@/components/tier-limit-alert"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import type { SubscriptionTier, Firearm } from "@/lib/types"
import { canAddItem } from "@/lib/tier-limits"
import { createClient } from "@/lib/supabase/client"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface AmmunitionBatch {
  id: string
  batch_number: string
  caliber: string
  quantity_remaining: number
  ammunition_type: string
}

interface AddSessionDialogProps {
  userId: string
  tier: SubscriptionTier
  currentCount: number
  firearms: Firearm[]
  ammunitionBatches: AmmunitionBatch[]
}

interface ShotData {
  velocity: string
  primer_appearance: string
  case_condition: string
  ejector_mark: boolean
  pressure_assessment: string
}

export function AddSessionDialog({ userId, tier, currentCount, firearms, ammunitionBatches }: AddSessionDialogProps) {
  const [open, setOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  console.log("[v0] AddSessionDialog received ammunitionBatches:", ammunitionBatches)

  const [formData, setFormData] = useState({
    firearm_id: "",
    ammunition_batch_id: "",
    session_date: new Date().toISOString().split("T")[0],
    rounds_fired: "",
    distance: "",
    temperature: "",
    humidity: "",
    wind_speed: "",
    wind_direction: "",
    location: "",
    notes: "",
  })

  const [shotData, setShotData] = useState<ShotData[]>([
    {
      velocity: "",
      primer_appearance: "normal",
      case_condition: "normal",
      ejector_mark: false,
      pressure_assessment: "normal",
    },
  ])

  const canAdd = canAddItem(currentCount, tier, "sessions")

  const selectedBatch = ammunitionBatches.find((batch) => batch.id === formData.ammunition_batch_id)
  const roundsFired = Number.parseInt(formData.rounds_fired) || 0
  const exceedsAvailable = selectedBatch && roundsFired > selectedBatch.quantity_remaining

  const handleRoundsFiredChange = (value: string) => {
    setFormData({ ...formData, rounds_fired: value })

    const rounds = Number.parseInt(value)
    if (rounds > 0 && rounds <= 100) {
      const newShotData: ShotData[] = Array.from({ length: rounds }, () => ({
        velocity: "",
        primer_appearance: "normal",
        case_condition: "normal",
        ejector_mark: false,
        pressure_assessment: "normal",
      }))
      setShotData(newShotData)
    }
  }

  const updateShotData = (index: number, field: keyof ShotData, value: string | boolean) => {
    const updated = [...shotData]
    updated[index] = { ...updated[index], [field]: value }
    setShotData(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canAdd) {
      setUpgradeOpen(true)
      return
    }

    if (exceedsAvailable) {
      alert(
        `Cannot fire ${roundsFired} rounds. Only ${selectedBatch?.quantity_remaining} rounds available in this batch.`,
      )
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data: session, error: sessionError } = await supabase
        .from("shooting_sessions")
        .insert({
          user_id: userId,
          firearm_id: formData.firearm_id,
          ammunition_batch_id: formData.ammunition_batch_id || null,
          date: formData.session_date,
          rounds_fired: Number.parseInt(formData.rounds_fired),
          temperature: formData.temperature ? Number.parseFloat(formData.temperature) : null,
          humidity: formData.humidity ? Number.parseFloat(formData.humidity) : null,
          wind_speed: formData.wind_speed ? Number.parseFloat(formData.wind_speed) : null,
          wind_direction: formData.wind_direction || null,
          location: formData.location || null,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      const shotDataToInsert = shotData
        .filter((shot) => shot.velocity)
        .map((shot, index) => ({
          session_id: session.id,
          shot_number: index + 1,
          velocity: Number.parseFloat(shot.velocity),
          primer_appearance: shot.primer_appearance,
          case_condition: shot.case_condition,
          ejector_mark: shot.ejector_mark,
          pressure_assessment: shot.pressure_assessment,
          distance: formData.distance ? Number.parseFloat(formData.distance) : null,
        }))

      if (shotDataToInsert.length > 0) {
        const { error: shotError } = await supabase.from("shot_data").insert(shotDataToInsert)
        if (shotError) throw shotError
      }

      if (formData.ammunition_batch_id && formData.rounds_fired) {
        console.log("[v0] Attempting to decrement ammunition:", {
          batch_id: formData.ammunition_batch_id,
          amount: Number.parseInt(formData.rounds_fired),
        })

        const { data: decrementData, error: updateError } = await supabase.rpc("decrement_ammunition_quantity", {
          batch_id: formData.ammunition_batch_id,
          amount: Number.parseInt(formData.rounds_fired),
        })

        if (updateError) {
          console.error("[v0] Error updating ammunition quantity:", updateError)
          alert(`Warning: Session logged but ammunition quantity was not updated. Error: ${updateError.message}`)
        } else {
          console.log("[v0] Successfully decremented ammunition quantity")
        }
      }

      if (formData.firearm_id && formData.rounds_fired) {
        console.log("[v0] Attempting to increment firearm round count:", {
          firearm_id: formData.firearm_id,
          amount: Number.parseInt(formData.rounds_fired),
        })

        const { error: firearmUpdateError } = await supabase.rpc("increment_firearm_round_count", {
          firearm_uuid: formData.firearm_id,
          amount: Number.parseInt(formData.rounds_fired),
        })

        if (firearmUpdateError) {
          console.error("[v0] Error updating firearm round count:", firearmUpdateError)
          alert(`Warning: Session logged but firearm round count was not updated. Error: ${firearmUpdateError.message}`)
        } else {
          console.log("[v0] Successfully incremented firearm round count")
        }
      }

      setOpen(false)
      setFormData({
        firearm_id: "",
        ammunition_batch_id: "",
        session_date: new Date().toISOString().split("T")[0],
        rounds_fired: "",
        distance: "",
        temperature: "",
        humidity: "",
        wind_speed: "",
        wind_direction: "",
        location: "",
        notes: "",
      })
      setShotData([
        {
          velocity: "",
          primer_appearance: "normal",
          case_condition: "normal",
          ejector_mark: false,
          pressure_assessment: "normal",
        },
      ])
      router.refresh()
    } catch (error) {
      console.error("Error adding session:", error)
      alert("Failed to add session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Session
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Shooting Session</DialogTitle>
            <DialogDescription>Record details from your range trip and track performance data</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {!canAdd && (
                <TierLimitAlert
                  title="Session Limit Reached"
                  description="Basic tier is limited to 10 sessions. Upgrade to Premium for unlimited sessions."
                  onUpgrade={() => setUpgradeOpen(true)}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firearm_id">Firearm *</Label>
                  <Select
                    value={formData.firearm_id}
                    onValueChange={(value) => setFormData({ ...formData, firearm_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select firearm" />
                    </SelectTrigger>
                    <SelectContent>
                      {firearms.map((firearm) => (
                        <SelectItem key={firearm.id} value={firearm.id}>
                          {firearm.manufacturer} {firearm.model} ({firearm.caliber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ammunition_batch_id">Ammunition Batch *</Label>
                  <Select
                    value={formData.ammunition_batch_id}
                    onValueChange={(value) => setFormData({ ...formData, ammunition_batch_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ammunition" />
                    </SelectTrigger>
                    <SelectContent>
                      {ammunitionBatches.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No ammunition batches available</div>
                      ) : (
                        ammunitionBatches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.batch_number} - {batch.caliber} ({batch.quantity_remaining} rounds)
                            {batch.ammunition_type === "factory" ? " - Factory" : " - Handload"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                    onChange={(e) => handleRoundsFiredChange(e.target.value)}
                    required
                    max={selectedBatch?.quantity_remaining}
                  />
                  {selectedBatch && (
                    <p className="text-xs text-muted-foreground">
                      Available: {selectedBatch.quantity_remaining} rounds
                    </p>
                  )}
                  {exceedsAvailable && (
                    <p className="text-xs text-destructive">
                      Cannot exceed {selectedBatch?.quantity_remaining} available rounds
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Shot data forms will be auto-generated based on this number
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="distance">Distance (yards)</Label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.1"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Range name or location"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wind_direction">Wind Direction</Label>
                  <Input
                    id="wind_direction"
                    value={formData.wind_direction}
                    onChange={(e) => setFormData({ ...formData, wind_direction: e.target.value })}
                    placeholder="e.g., NW, 3 o'clock"
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
                    placeholder="72"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="humidity">Humidity (%)</Label>
                  <Input
                    id="humidity"
                    type="number"
                    value={formData.humidity}
                    onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                    placeholder="50"
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
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Shot Data (Optional)</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Track individual shot velocity and pressure signs. Forms auto-generated based on rounds fired.
                </p>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {shotData.map((shot, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Shot #{index + 1}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label htmlFor={`velocity-${index}`}>Velocity (FPS)</Label>
                          <Input
                            id={`velocity-${index}`}
                            type="number"
                            value={shot.velocity}
                            onChange={(e) => updateShotData(index, "velocity", e.target.value)}
                            placeholder="2850"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`primer-${index}`}>Primer Appearance</Label>
                          <Select
                            value={shot.primer_appearance}
                            onValueChange={(value) => updateShotData(index, "primer_appearance", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="flat">Flat</SelectItem>
                              <SelectItem value="cratered">Cratered</SelectItem>
                              <SelectItem value="pierced">Pierced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label htmlFor={`case-${index}`}>Case Condition</Label>
                          <Select
                            value={shot.case_condition}
                            onValueChange={(value) => updateShotData(index, "case_condition", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="sticky_extraction">Sticky Extraction</SelectItem>
                              <SelectItem value="hard_bolt_lift">Hard Bolt Lift</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`pressure-${index}`}>Pressure Assessment</Label>
                          <Select
                            value={shot.pressure_assessment}
                            onValueChange={(value) => updateShotData(index, "pressure_assessment", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="mild">Mild</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="excessive">Excessive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`ejector-${index}`}
                          checked={shot.ejector_mark}
                          onChange={(e) => updateShotData(index, "ejector_mark", e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`ejector-${index}`} className="text-sm font-normal">
                          Ejector Mark Present
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Session Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Overall performance observations, conditions, adjustments..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !canAdd || exceedsAvailable}>
                {isLoading ? "Logging..." : "Log Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  )
}
