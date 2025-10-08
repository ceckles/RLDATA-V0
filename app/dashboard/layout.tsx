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

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  console.log("[v0] Profile data:", profile)
  console.log("[v0] Profile role:", profile?.role)
  console.log("[v0] User ID:", user.id)

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav profile={profile} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
