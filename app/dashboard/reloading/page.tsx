import { createClient } from "@/lib/supabase/server"
import { FlaskConical } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AddAmmunitionBatchDialog } from "@/components/add-ammunition-batch-dialog"
import { TrackingPreferencesDialog } from "@/components/tracking-preferences-dialog"
import { AmmunitionBatchCard } from "@/components/ammunition-batch-card"

export default async function ReloadingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: ammunitionBatches }, { data: components }, { data: preferences }] = await Promise.all([
    supabase.from("ammunition_batches").select("*").eq("user_id", user.id).order("date_produced", { ascending: false }),
    supabase.from("components").select("*").eq("user_id", user.id),
    supabase.from("user_tracking_preferences").select("*").eq("user_id", user.id).single(),
  ])

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 sm:h-8 sm:w-8" />
            Ammunition Inventory
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track hand-loaded and factory ammunition batches</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          <TrackingPreferencesDialog userId={user.id} preferences={preferences} />
          <AddAmmunitionBatchDialog userId={user.id} components={components || []} preferences={preferences} />
        </div>
      </div>

      {!ammunitionBatches || ammunitionBatches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Ammunition Batches Yet</CardTitle>
            <CardDescription>
              Start tracking your ammunition by logging your first batch - either hand-loaded or factory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track detailed information about your ammunition batches including load data, measurements, and costs. You
              can log both hand-loaded ammunition (created from components) and factory ammunition.
            </p>
            <AddAmmunitionBatchDialog
              userId={user.id}
              components={components || []}
              preferences={preferences}
              trigger={
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  <FlaskConical className="h-4 w-4" />
                  Add Your First Ammunition Batch
                </button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {ammunitionBatches.map((batch) => (
            <AmmunitionBatchCard key={batch.id} batch={batch} components={components || []} preferences={preferences} />
          ))}
        </div>
      )}
    </div>
  )
}
