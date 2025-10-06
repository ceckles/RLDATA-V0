import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Target, TrendingUp, Box, Wrench } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import ThemeToggle from "@/components/theme-toggle"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Target className="h-6 w-6" />
            <span className="font-bold text-xl">ReloadData</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto max-w-7xl px-4 py-24 space-y-8">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-balance">
              Track Your Reloading Data with Precision
            </h1>
            <p className="text-xl text-muted-foreground text-balance">
              Manage components, firearms, and shooting sessions. Analyze performance and optimize your loads.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/auth/sign-up">
                <Button size="lg">Start Free</Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Box className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Component Inventory</CardTitle>
                <CardDescription>
                  Track primers, powder, bullets, and brass with detailed specifications
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Firearms Registry</CardTitle>
                <CardDescription>Manage your firearms collection with complete specifications</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Wrench className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Session Logger</CardTitle>
                <CardDescription>Record range trips with environmental conditions and performance</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Visualize trends and optimize your reloading recipes</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="container mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
              <p className="text-muted-foreground">Start free, upgrade when you need more</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Basic</CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Free</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">3 firearms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">20 total components</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">10 shooting sessions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Basic tracking</span>
                    </div>
                  </div>
                  <Link href="/auth/sign-up" className="block">
                    <Button className="w-full bg-transparent" variant="outline">
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Premium
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Popular</span>
                  </CardTitle>
                  <CardDescription>For serious reloaders</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$5.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Unlimited firearms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Unlimited components</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Unlimited sessions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Advanced analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Performance charts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Priority support</span>
                    </div>
                  </div>
                  <Link href="/auth/sign-up" className="block">
                    <Button className="w-full">Start Premium Trial</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto max-w-7xl px-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">© 2025 ReloadData. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Link href="/auth/sign-up" className="text-sm text-muted-foreground hover:text-foreground">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
