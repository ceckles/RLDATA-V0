"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Profile } from "@/lib/types"

interface UserAvatarProps {
  profile: Profile | null
  ssoAvatarUrl?: string | null
  className?: string
  fallbackText?: string
}

export function UserAvatar({ profile, ssoAvatarUrl, className, fallbackText }: UserAvatarProps) {
  const avatarUrl = profile?.avatar_url || ssoAvatarUrl || "/default-avatar.png"

  // Generate fallback initials from name or email
  const getFallbackText = () => {
    if (fallbackText) return fallbackText
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (profile?.email) {
      return profile.email[0].toUpperCase()
    }
    return "U"
  }

  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={profile?.full_name || "User avatar"} />
      <AvatarFallback>{getFallbackText()}</AvatarFallback>
    </Avatar>
  )
}
