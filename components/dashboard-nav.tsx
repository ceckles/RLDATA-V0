"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SubscriptionBadge } from "@/components/subscription-badge"
import ThemeToggle from "@/components/theme-toggle"
import { UserAvatar } from "@/components/user-avatar"
import type { Profile } from "@/lib/types"
import { BarChart3, Box, LogOut, Settings, Target, Wrench, Crosshair, Crown, Menu, TrendingUp } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

interface DashboardNavProps {
  profile: Profile | null
  ssoAvatarUrl?: string | null
}

export function DashboardNav({ profile, ssoAvatarUrl }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  console.log("[v0] DashboardNav - received profile:", profile)
  console.log("[v0] DashboardNav - received profile.avatar_url:", profile?.avatar_url)
  console.log("[v0] DashboardNav - received ssoAvatarUrl:", ssoAvatarUrl)

  const handleSignOut = async () => {
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/portal")
      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      }
    } catch (error) {
      console.error("Failed to open customer portal:", error)
    }
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/dashboard/inventory", label: "Inventory", icon: Box },
    { href: "/dashboard/firearms", label: "Firearms", icon: Target },
    { href: "/dashboard/reloading", label: "Reloading", icon: Wrench },
    { href: "/dashboard/shooting", label: "Shooting", icon: Crosshair },
    { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 flex h-14 items-center">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden mr-2">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col space-y-4 mt-6">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent ${
                      pathname === item.href ? "bg-accent text-foreground" : "text-foreground/60"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center flex-1">
          <Link href="/dashboard" className="flex items-center space-x-2 mr-6">
            <span className="font-bold">ReloadData</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 transition-colors hover:text-foreground/80 ${
                    pathname === item.href ? "text-foreground" : "text-foreground/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {profile && (!profile.subscription_tier || profile.subscription_tier === "basic") && (
            <Link href="/dashboard/settings" className="hidden sm:block">
              <Button size="sm" variant="default" className="gap-2">
                <Crown className="h-4 w-4" />
                <span className="hidden lg:inline">Upgrade to Premium</span>
                <span className="lg:hidden">Upgrade</span>
              </Button>
            </Link>
          )}
          {profile && <SubscriptionBadge tier={profile.subscription_tier} className="hidden sm:flex" />}
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserAvatar profile={profile} ssoAvatarUrl={ssoAvatarUrl} className="h-8 w-8" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              {profile?.subscription_tier === "premium" && (
                <DropdownMenuItem onClick={handleManageSubscription}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Subscription
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
