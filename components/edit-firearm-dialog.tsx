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
import type { Firearm, FirearmType } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Upload, X } from "lucide-react"

interface EditFirearmDialogProps {
  firearm: Firearm
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditFirearmDialog({ firearm, open, onOpenChange }: EditFirearmDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(firearm.image_url || null)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    type: firearm.type as FirearmType,
    name: firearm.name || "",
    manufacturer: firearm.manufacturer,
    model: firearm.model,
    caliber: firearm.caliber,
    serial_number: firearm.serial_number || "",
    barrel_length: firearm.barrel_length?.toString() || "",
    twist_rate: firearm.twist_rate || "",
    purchase_date: firearm.purchase_date || "",
    notes: firearm.notes || "",
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image")
      return
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("Image must be less than 2MB")
      return
    }

    setImageFile(file)
    setRemoveExistingImage(false)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveExistingImage(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      const firearmName = formData.name || `${formData.manufacturer} ${formData.model}`.trim()

      let imageUrl = firearm.image_url

      if ((removeExistingImage || imageFile) && firearm.image_url) {
        const oldPath = firearm.image_url.split("/firearm-images/")[1]
        if (oldPath) {
          await supabase.storage.from("firearm-images").remove([oldPath])
        }
      }

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${firearm.user_id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from("firearm-images").upload(fileName, imageFile, {
          cacheControl: "3600",
          upsert: false,
        })

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("firearm-images").getPublicUrl(fileName)

        imageUrl = publicUrl
      } else if (removeExistingImage) {
        imageUrl = null
      }

      const { error } = await supabase
        .from("firearms")
        .update({
          type: formData.type,
          name: firearmName,
          manufacturer: formData.manufacturer,
          model: formData.model,
          caliber: formData.caliber,
          serial_number: formData.serial_number || null,
          barrel_length: formData.barrel_length ? Number.parseFloat(formData.barrel_length) : null,
          twist_rate: formData.twist_rate || null,
          purchase_date: formData.purchase_date || null,
          notes: formData.notes || null,
          image_url: imageUrl,
        })
        .eq("id", firearm.id)

      if (error) throw error

      toast.success("Firearm updated successfully")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating firearm:", error)
      toast.error("Failed to update firearm. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Firearm</DialogTitle>
          <DialogDescription>Update firearm details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as FirearmType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rifle">Rifle</SelectItem>
                  <SelectItem value="pistol">Pistol</SelectItem>
                  <SelectItem value="shotgun">Shotgun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Leave blank to auto-generate from manufacturer and model"
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="caliber">Caliber *</Label>
                <Input
                  id="caliber"
                  value={formData.caliber}
                  onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                  placeholder=".308 Win"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="barrel_length">Barrel Length (inches)</Label>
                <Input
                  id="barrel_length"
                  type="number"
                  step="0.1"
                  value={formData.barrel_length}
                  onChange={(e) => setFormData({ ...formData, barrel_length: e.target.value })}
                  placeholder="24"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="twist_rate">Twist Rate (1:X inches)</Label>
                <Input
                  id="twist_rate"
                  type="text"
                  value={formData.twist_rate}
                  onChange={(e) => setFormData({ ...formData, twist_rate: e.target.value })}
                  placeholder="10"
                />
              </div>
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

            <div className="grid gap-2">
              <Label htmlFor="round_count">Current Round Count</Label>
              <Input id="round_count" type="number" value={firearm.round_count || 0} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Round count is automatically tracked through shooting sessions
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Firearm Image</Label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Firearm preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    id="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="image" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Click to upload firearm image</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or WebP (max 2MB)</p>
                  </label>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this firearm..."
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
