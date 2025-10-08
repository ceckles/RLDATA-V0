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
  console.log("[v0] UserAvatar - profile.avatar_url:", profile?.avatar_url)
  console.log("[v0] UserAvatar - ssoAvatarUrl:", ssoAvatarUrl)

  let avatarUrl: string
  if (profile?.avatar_url) {
    avatarUrl = profile.avatar_url
    console.log("[v0] UserAvatar - Using uploaded avatar")
  } else if (ssoAvatarUrl) {
    avatarUrl = ssoAvatarUrl
    console.log("[v0] UserAvatar - Using SSO avatar")
  } else {
    avatarUrl = "/default-avatar.png"
    console.log("[v0] UserAvatar - Using default avatar")
  }

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
      <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={profile?.full_name || "User avatar"} key={avatarUrl} />
      <AvatarFallback>{getFallbackText()}</AvatarFallback>
    </Avatar>
  )
}
