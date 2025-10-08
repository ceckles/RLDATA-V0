"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ShootingSession } from "@/lib/types"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts"
import { TrendingUp } from "lucide-react"

interface AnalyticsChartsProps {
  sessions: (ShootingSession & { firearms: { manufacturer: string; model: string } | null })[]
}

const CHART_COLORS = {
  primary: "#ea580c", // Orange color matching the site theme
  secondary: "#3b82f6", // Blue
  accent: "#10b981", // Green
}

export function AnalyticsCharts({ sessions }: AnalyticsChartsProps) {
  // Group size trend data
  const groupSizeData = sessions
    .filter((s) => s.group_size)
    .slice(0, 10)
    .reverse()
    .map((session, index) => ({
      session: `#${index + 1}`,
      groupSize: session.group_size,
      date: new Date(session.session_date).toLocaleDateString(),
    }))

  // Rounds fired by firearm
  const roundsByFirearm = sessions.reduce(
    (acc, session) => {
      const firearmName = session.firearms ? `${session.firearms.manufacturer} ${session.firearms.model}` : "Unknown"
      acc[firearmName] = (acc[firearmName] || 0) + session.rounds_fired
      return acc
    },
    {} as Record<string, number>,
  )

  const roundsData = Object.entries(roundsByFirearm).map(([name, rounds]) => ({
    firearm: name.length > 20 ? name.substring(0, 20) + "..." : name,
    rounds,
  }))

  // Sessions over time
  const sessionsByMonth = sessions.reduce(
    (acc, session) => {
      const month = new Date(session.session_date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      acc[month] = (acc[month] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const sessionsData = Object.entries(sessionsByMonth)
    .map(([month, count]) => ({
      month,
      sessions: count,
    }))
    .slice(-6)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groupSizeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Group Size Trend
            </CardTitle>
            <CardDescription>Your accuracy over recent sessions (inches)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={groupSizeData}>
                <XAxis dataKey="session" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">Group Size</span>
                              <span className="font-bold text-muted-foreground">{payload[0].value}"</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="groupSize"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={3}
                  dot={{ r: 4, fill: CHART_COLORS.primary, strokeWidth: 2, stroke: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {roundsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rounds by Firearm</CardTitle>
            <CardDescription>Total rounds fired per firearm</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={roundsData}>
                <XAxis dataKey="firearm" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">Rounds</span>
                              <span className="font-bold text-muted-foreground">{payload[0].value}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="rounds" fill={CHART_COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {sessionsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Session Activity</CardTitle>
            <CardDescription>Sessions logged per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sessionsData}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">Sessions</span>
                              <span className="font-bold text-muted-foreground">{payload[0].value}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="sessions" fill={CHART_COLORS.secondary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
