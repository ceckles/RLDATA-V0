"use client"

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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { UserTrackingPreferences } from "@/lib/types"
import { toast } from "sonner"

interface TrackingPreferencesDialogProps {
  userId: string
  preferences: UserTrackingPreferences | null
}

export function TrackingPreferencesDialog({ userId, preferences }: TrackingPreferencesDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [prefs, setPrefs] = useState({
    track_charge_weight: preferences?.track_charge_weight ?? true,
    track_coal: preferences?.track_coal ?? true,
    track_seating_depth_ogive: preferences?.track_seating_depth_ogive ?? false,
    track_cartridge_weight: preferences?.track_cartridge_weight ?? false,
    track_neck_tension: preferences?.track_neck_tension ?? false,
    track_bushing_size: preferences?.track_bushing_size ?? false,
    track_case_trim_length: preferences?.track_case_trim_length ?? false,
    track_primer_seating_depth: preferences?.track_primer_seating_depth ?? false,
    track_crimp_type: preferences?.track_crimp_type ?? true,
    track_crimp_measurement: preferences?.track_crimp_measurement ?? false,
    track_number_of_firings: preferences?.track_number_of_firings ?? true,
  })

  const handleSave = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      if (preferences) {
        // Update existing preferences
        const { error } = await supabase.from("user_tracking_preferences").update(prefs).eq("user_id", userId)

        if (error) throw error
      } else {
        // Create new preferences
        const { error } = await supabase.from("user_tracking_preferences").insert({ user_id: userId, ...prefs })

        if (error) throw error
      }

      toast.success("Preferences saved successfully")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast.error("Failed to save preferences")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Tracking Preferences
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ammunition Tracking Preferences</DialogTitle>
          <DialogDescription>
            Choose which fields you want to track when logging ammunition batches. Disabled fields won't appear in the
            form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="track_charge_weight" className="flex flex-col gap-1">
              <span>Charge Weight</span>
              <span className="text-sm font-normal text-muted-foreground">Track powder charge weight in grains</span>
            </Label>
            <Switch
              id="track_charge_weight"
              checked={prefs.track_charge_weight}
              onCheckedChange={(checked) => setPrefs({ ...prefs, track_charge_weight: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="track_coal" className="flex flex-col gap-1">
              <span>COAL (Cartridge Overall Length)</span>
              <span className="text-sm font-normal text-muted-foreground">Track overall cartridge length</span>
            </Label>
            <Switch
              id="track_coal"
              checked={prefs.track_coal}
              onCheckedChange={(checked) => setPrefs({ ...prefs, track_coal: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="track_seating_depth_ogive" className="flex flex-col gap-1">
              <span>Seating Depth (Ogive)</span>
              <span className="text-sm font-normal text-muted-foreground">
                Track bullet seating depth relative to ogive
              </span>
            </Label>
            <Switch
              id="track_seating_depth_ogive"
              checked={prefs.track_seating_depth_ogive}
              onCheckedChange={(checked) => setPrefs({ ...prefs, track_seating_depth_ogive: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="track_cartridge_weight" className="flex flex-col gap-1">
              <span>Cartridge Weight</span>
              <span className="text-sm font-normal text-muted-foreground">Track total cartridge weight in grains</span>
            </Label>
            <Switch
              id="track_cartridge_weight"
              checked={prefs.track_cartridge_weight}
              onCheckedChange={(checked) => setPrefs({ ...prefs, track_cartridge_weight: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="track_neck_tension" className="flex flex-col gap-1">
              <span>Neck Tension</span>
              <span className="text-sm font-normal text-muted-foreground">Track case neck tension measurement</span>
            </Label>
            <Switch
              id="track_neck_tension"
              checked={prefs.track_neck_tension}
              onCheckedChange={(checked) => setPrefs({ ...prefs, track_neck_tension: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="track_bushing_size" className="flex flex-col gap-1">
              <span>Bushing Size</span>
              <span className="text-sm font-normal text-muted-foreground">Track neck sizing bushing diameter</span>
            </Label>
            <Switch
              id="track_bushing_size"
              checked={prefs.track_bushing_size}
              onCheckedChange={(checked) => setPrefs({ ...prefs, track_bushing_size: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="track_case_trim_length" className="flex flex-col gap-1">
              <span>Case Trim Length</span>
              <span className="text-sm font-normal text-muted-foreground">Track brass case trim length</span>
            </Label>
            <Switch
              id="track_case_trim_length"
              checked={prefs.track_case_trim_length}
              onCheckedChange={(checked) => setPrefs({ ...prefs, track_case_trim_length: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="track_primer_seating_depth" className="flex flex-col gap-1">
              <span>Primer Seating Depth</span>
              <span className="text-sm font-normal text-muted-foreground">Track primer seating depth measurement</span>
            </Label>
            <Switch
              id="track_primer_seating_depth"
              checked={prefs.track_primer_seating_depth}
              onCheckedChange={(checked) => setPrefs({ ...prefs, track_primer_seating_depth: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="track_crimp_type" className="flex flex-col gap-1">
              <span>Crimp Type</span>
              <span className="text-sm font-normal text-muted-foreground">Track crimp type (roll, taper, none)</span>
            </Label>
            <Switch
              id="track_crimp_type"
              checked={prefs.track_crimp_type}
              onCheckedChange={(checked) => setPrefs({ ...prefs, track_crimp_type: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="track_crimp_measurement" className="flex flex-col gap-1">
              <span>Crimp Measurement</span>
              <span className="text-sm font-normal text-muted-foreground">Track crimp depth measurement</span>
            </Label>
            <Switch
              id="track_crimp_measurement"
              checked={prefs.track_crimp_measurement}
              onCheckedChange={(checked) => setPrefs({ ...prefs, track_crimp_measurement: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="track_number_of_firings" className="flex flex-col gap-1">
              <span>Number of Firings</span>
              <span className="text-sm font-normal text-muted-foreground">
                Track how many times brass has been fired
              </span>
            </Label>
            <Switch
              id="track_number_of_firings"
              checked={prefs.track_number_of_firings}
              onCheckedChange={(checked) => setPrefs({ ...prefs, track_number_of_firings: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Preferences"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
