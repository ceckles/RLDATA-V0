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
import { SubscriptionBadge } from "@/components/subscription-badge"
import ThemeToggle from "@/components/theme-toggle"
import type { Profile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { BarChart3, Box, LogOut, Settings, Target, User, Wrench, Crosshair, Crown } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

interface DashboardNavProps {
  profile: Profile | null
}

export function DashboardNav({ profile }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
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
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">ReloadData</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
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
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {profile && (!profile.subscription_tier || profile.subscription_tier === "basic") && (
            <Link href="/dashboard/settings">
              <Button size="sm" variant="default" className="gap-2">
                <Crown className="h-4 w-4" />
                Upgrade to Premium
              </Button>
            </Link>
          )}
          {profile && <SubscriptionBadge tier={profile.subscription_tier} />}
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
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
