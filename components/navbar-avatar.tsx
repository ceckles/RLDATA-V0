"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavbarAvatarProps {
  ssoAvatarUrl: string | null
  userEmail: string
  className?: string
}

export function NavbarAvatar({ ssoAvatarUrl, userEmail, className }: NavbarAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAvatar() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()

        setAvatarUrl(profile?.avatar_url || ssoAvatarUrl || null)
      } else {
        setAvatarUrl(ssoAvatarUrl || null)
      }
      setIsLoading(false)
    }

    fetchAvatar()
  }, [ssoAvatarUrl])

  const fallbackText = userEmail?.charAt(0).toUpperCase() || "U"
  const finalAvatarUrl = avatarUrl || ssoAvatarUrl

  return (
    <Avatar className={className}>
      {finalAvatarUrl && <AvatarImage src={finalAvatarUrl || "/placeholder.svg"} alt="User avatar" />}
      <AvatarFallback>{fallbackText}</AvatarFallback>
    </Avatar>
  )
}
