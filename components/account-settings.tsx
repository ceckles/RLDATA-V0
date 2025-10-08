"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createBrowserClient } from "@supabase/ssr"
import { User, Upload, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Profile } from "@/lib/types"

interface AccountSettingsProps {
  profile: Profile
}

export function AccountSettings({ profile }: AccountSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name || "")
  const [username, setUsername] = useState(profile.username || "")
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB")
      return
    }

    setError(null)
    setAvatarFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setAvatarFile(null)
    setPreviewUrl(null)
    if (avatarUrl) {
      setAvatarUrl("")
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let newAvatarUrl = avatarUrl

      // Upload new avatar if selected
      if (avatarFile) {
        setIsUploading(true)

        // Delete old avatar if exists
        if (avatarUrl) {
          const oldPath = avatarUrl.split("/").pop()
          if (oldPath) {
            await supabase.storage.from("avatars").remove([`${profile.id}/${oldPath}`])
          }
        }

        // Upload new avatar
        const fileExt = avatarFile.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${profile.id}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile)

        if (uploadError) throw uploadError

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath)

        newAvatarUrl = publicUrl
        setIsUploading(false)
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          username: username || null,
          avatar_url: newAvatarUrl || null,
        })
        .eq("id", profile.id)

      if (updateError) throw updateError

      router.refresh()
      setAvatarFile(null)
      setPreviewUrl(null)
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
      setIsUploading(false)
    }
  }

  const displayAvatarUrl = previewUrl || avatarUrl
  const hasChanges =
    fullName !== (profile.full_name || "") ||
    username !== (profile.username || "") ||
    avatarFile !== null ||
    (avatarUrl === "" && profile.avatar_url)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
        <CardDescription>Update your profile details and avatar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={displayAvatarUrl || "/placeholder.svg"} alt={fullName || "User avatar"} />
            <AvatarFallback>
              <User className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild disabled={isLoading}>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {displayAvatarUrl ? "Change" : "Upload"} Photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </Button>
              {displayAvatarUrl && (
                <Button variant="ghost" size="sm" onClick={handleRemoveImage} disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 2MB.</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <Button onClick={handleSave} disabled={!hasChanges || isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isUploading ? "Uploading..." : "Saving..."}
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
