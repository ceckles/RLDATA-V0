"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Target, Trash2, Pencil } from "lucide-react"
import { useState } from "react"
import { DeleteSessionDialog } from "./delete-session-dialog"
import { EditSessionDialog } from "./edit-session-dialog"

interface SessionsListProps {
  sessions: any[]
  firearms: any[]
  ammunitionBatches: any[]
}

export function SessionsList({ sessions, firearms, ammunitionBatches }: SessionsListProps) {
  const [deletingSession, setDeletingSession] = useState<any | null>(null)
  const [editingSession, setEditingSession] = useState<any | null>(null)

  console.log("[v0] SessionsList received sessions:", sessions)

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No sessions found. Log your first range trip to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {session.firearms
                      ? `${session.firearms.manufacturer} ${session.firearms.model}`
                      : "Unknown Firearm"}
                  </CardTitle>
                  <CardDescription>{new Date(session.date).toLocaleDateString()}</CardDescription>
                </div>
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Rounds:</span>
                  <p className="font-medium">{session.rounds_fired}</p>
                </div>
                {session.ammunition_batches && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Ammunition:</span>
                    <p className="font-medium">
                      {session.ammunition_batches.batch_number} - {session.ammunition_batches.caliber}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {session.ammunition_batches.ammunition_type === "factory" ? "Factory" : "Handload"}
                    </Badge>
                  </div>
                )}
                {session.temperature && (
                  <div>
                    <span className="text-muted-foreground">Temp:</span>
                    <p className="font-medium">{session.temperature}°F</p>
                  </div>
                )}
                {session.humidity && (
                  <div>
                    <span className="text-muted-foreground">Humidity:</span>
                    <p className="font-medium">{session.humidity}%</p>
                  </div>
                )}
                {session.wind_speed && (
                  <div>
                    <span className="text-muted-foreground">Wind:</span>
                    <p className="font-medium">
                      {session.wind_speed} mph {session.wind_direction && `(${session.wind_direction})`}
                    </p>
                  </div>
                )}
                {session.location && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{session.location}</p>
                  </div>
                )}
              </div>

              {session.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="mt-1">{session.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => setEditingSession(session)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => setDeletingSession(session)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {deletingSession && (
        <DeleteSessionDialog
          session={deletingSession}
          open={!!deletingSession}
          onOpenChange={(open) => !open && setDeletingSession(null)}
        />
      )}

      {editingSession && (
        <EditSessionDialog
          session={editingSession}
          firearms={firearms}
          ammunitionBatches={ammunitionBatches}
          open={!!editingSession}
          onOpenChange={(open) => !open && setEditingSession(null)}
        />
      )}
    </>
  )
}
