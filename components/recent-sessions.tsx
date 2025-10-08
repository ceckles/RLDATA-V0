import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ShootingSession } from "@/lib/types"
import { Target } from "lucide-react"
import Link from "next/link"

interface RecentSessionsProps {
  sessions: (ShootingSession & { firearms: { manufacturer: string; model: string } | null })[]
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
        <CardDescription>Your latest range trips</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/dashboard/shooting?session=${session.id}`}
                className="block hover:bg-accent/50 transition-colors rounded-lg p-2 -m-2"
              >
                <div className="flex items-start justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {session.firearms
                          ? `${session.firearms.manufacturer} ${session.firearms.model}`
                          : "Unknown Firearm"}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.session_date).toLocaleDateString()} • {session.rounds_fired} rounds
                    </p>
                    {session.group_size && (
                      <Badge variant="secondary" className="text-xs">
                        {session.group_size}" group
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/dashboard/shooting" className="block text-sm text-primary hover:underline">
              View all sessions →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No sessions logged yet</p>
        )}
      </CardContent>
    </Card>
  )
}
