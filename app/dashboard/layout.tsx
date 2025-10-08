import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"

export const revalidate = 0

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, subscription_status, subscription_tier, subscription_end_date")
    .eq("id", user.id)
    .single()

  const ssoAvatarUrl = user.user_metadata?.avatar_url || null

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav profile={profile} ssoAvatarUrl={ssoAvatarUrl} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
