import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, subscription_status, subscription_end_date, role")
    .eq("id", user.id)
    .single()

  console.log("[v0] Profile query error:", error)
  console.log("[v0] Profile data:", profile)
  console.log("[v0] Profile role:", profile?.role)

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav profile={profile} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
