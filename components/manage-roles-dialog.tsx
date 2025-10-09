"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RoleBadge } from "@/components/role-badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface UserRole {
  id: string
  name: string
  display_name: string
  description: string
  assigned_at: string
  expires_at: string | null
}

interface User {
  id: string
  email: string
  full_name: string | null
  roles: UserRole[] | null
}

interface ManageRolesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

interface AvailableRole {
  id: string
  name: string
  display_name: string
  description: string
}

export function ManageRolesDialog({ open, onOpenChange, user }: ManageRolesDialogProps) {
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([])
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())
  const [expirationDates, setExpirationDates] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchAvailableRoles()
      setSelectedRoles(new Set(user.roles?.map((r) => r.name) || []))
    }
  }, [open, user])

  const fetchAvailableRoles = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/roles/all")
      if (response.ok) {
        const data = await response.json()
        setAvailableRoles(data.roles || [])
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
      toast({
        title: "Error",
        description: "Failed to load available roles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRole = (roleName: string) => {
    const newSelected = new Set(selectedRoles)
    if (newSelected.has(roleName)) {
      newSelected.delete(roleName)
    } else {
      newSelected.add(roleName)
    }
    setSelectedRoles(newSelected)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const currentRoleNames = new Set(user.roles?.map((r) => r.name) || [])
      const rolesToAdd = Array.from(selectedRoles).filter((r) => !currentRoleNames.has(r))
      const rolesToRemove = Array.from(currentRoleNames).filter((r) => !selectedRoles.has(r))

      // Add new roles
      for (const roleName of rolesToAdd) {
        const role = availableRoles.find((r) => r.name === roleName)
        if (!role) continue

        const response = await fetch("/api/roles/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            roleId: role.id,
            expiresAt: expirationDates[roleName] || null,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to assign ${roleName} role`)
        }
      }

      // Remove roles
      for (const roleName of rolesToRemove) {
        const role = user.roles?.find((r) => r.name === roleName)
        if (!role) continue

        const response = await fetch("/api/roles/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            roleId: role.id,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to remove ${roleName} role`)
        }
      }

      toast({
        title: "Success",
        description: "User roles updated successfully",
      })

      onOpenChange(false)
      window.location.reload()
    } catch (error) {
      console.error("Failed to update roles:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update roles",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
          <DialogDescription>Assign or remove roles for {user.full_name || user.email}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {availableRoles.map((role) => {
              const isSelected = selectedRoles.has(role.name)
              return (
                <div key={role.id} className="flex items-start space-x-3 rounded-lg border p-4">
                  <Checkbox id={role.name} checked={isSelected} onCheckedChange={() => handleToggleRole(role.name)} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={role.name} className="cursor-pointer font-medium">
                        {role.display_name}
                      </Label>
                      <RoleBadge role={role.name} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                    {isSelected && (
                      <div className="pt-2">
                        <Label htmlFor={`${role.name}-expiration`} className="text-xs">
                          Expiration Date (optional)
                        </Label>
                        <Input
                          id={`${role.name}-expiration`}
                          type="date"
                          value={expirationDates[role.name] || ""}
                          onChange={(e) =>
                            setExpirationDates((prev) => ({
                              ...prev,
                              [role.name]: e.target.value,
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
