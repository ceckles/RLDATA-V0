"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Profile, ShootingSession } from "@/lib/types"
import { BarChart3, Target, TrendingUp, Zap, Wind, Crown, Filter, X } from "lucide-react"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Scatter,
  ScatterChart,
  ZAxis,
  Bar,
  BarChart,
  ReferenceLine,
} from "recharts"
import Link from "next/link"

interface AnalyticsContentProps {
  profile: Profile | null
  sessions: (ShootingSession & {
    firearms: { id: string; name: string; manufacturer: string; model: string; caliber: string } | null
    load_recipes: { id: string; name: string; caliber: string } | null
    shot_data?: Array<{
      id: string
      shot_number: number
      distance: number
      group_size: number | null
      velocity: number | null
      poi_horizontal: number | null
      poi_vertical: number | null
      notes: string | null
    }>
  })[]
}

export function AnalyticsContent({ profile, sessions }: AnalyticsContentProps) {
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [filterFirearm, setFilterFirearm] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "groupSize" | "rounds">("date")

  const isPremium = profile?.subscription_tier === "premium"

  // Get unique firearms for filter
  const firearms = Array.from(
    new Set(
      sessions.filter((s) => s.firearms).map((s) => JSON.stringify({ id: s.firearms!.id, name: s.firearms!.name })),
    ),
  ).map((s) => JSON.parse(s))

  // Filter and sort sessions
  const filteredSessions = sessions
    .filter((s) => {
      if (filterFirearm === "all") return true
      return s.firearms?.id === filterFirearm
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy === "groupSize") {
        if (!a.group_size) return 1
        if (!b.group_size) return -1
        return a.group_size - b.group_size
      }
      if (sortBy === "rounds") return b.rounds_fired - a.rounds_fired
      return 0
    })

  // Toggle session selection
  const toggleSession = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId],
    )
  }

  // Get selected session data
  const selectedSessionData = sessions.filter((s) => selectedSessions.includes(s.id))

  // Calculate comparison metrics
  const comparisonData =
    selectedSessionData.length > 0
      ? selectedSessionData.map((session) => {
          const shotData = session.shot_data || []
          const velocities = shotData.filter((s) => s.velocity).map((s) => s.velocity!)
          const avgVelocity = velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : null
          const maxVelocity = velocities.length > 0 ? Math.max(...velocities) : null
          const minVelocity = velocities.length > 0 ? Math.min(...velocities) : null
          const es = maxVelocity && minVelocity ? maxVelocity - minVelocity : null
          const sd =
            velocities.length > 1
              ? Math.sqrt(velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity!, 2), 0) / velocities.length)
              : null

          return {
            id: session.id,
            date: new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            firearm: session.firearms ? `${session.firearms.manufacturer} ${session.firearms.model}` : "Unknown",
            groupSize: session.group_size,
            rounds: session.rounds_fired,
            avgVelocity: avgVelocity ? Math.round(avgVelocity) : null,
            es,
            sd: sd ? Math.round(sd) : null,
            temperature: session.temperature,
            windSpeed: session.wind_speed,
            shotCount: shotData.length,
          }
        })
      : []

  // Shot distribution for selected sessions
  const shotDistributionData =
    selectedSessionData.length === 1 && selectedSessionData[0].shot_data
      ? selectedSessionData[0].shot_data
          .filter((shot) => shot.poi_horizontal !== null && shot.poi_vertical !== null)
          .map((shot) => ({
            x: shot.poi_horizontal,
            y: shot.poi_vertical,
            shotNumber: shot.shot_number,
            velocity: shot.velocity,
          }))
      : []

  const shotVelocityData =
    selectedSessionData.length > 0
      ? selectedSessionData.flatMap((session) => {
          const shotData = session.shot_data || []
          return shotData
            .filter((shot) => shot.velocity !== null)
            .map((shot) => ({
              sessionId: session.id,
              sessionDate: new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              shotNumber: shot.shot_number,
              velocity: shot.velocity!,
              firearm: session.firearms ? `${session.firearms.manufacturer} ${session.firearms.model}` : "Unknown",
            }))
        })
      : []

  const velocityStats = selectedSessionData
    .map((session) => {
      const shotData = session.shot_data || []
      const velocities = shotData.filter((s) => s.velocity).map((s) => s.velocity!)

      if (velocities.length === 0) return null

      const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length
      const maxVelocity = Math.max(...velocities)
      const minVelocity = Math.min(...velocities)
      const es = maxVelocity - minVelocity
      const sd =
        velocities.length > 1
          ? Math.sqrt(velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length)
          : 0
      const cv = avgVelocity > 0 ? (sd / avgVelocity) * 100 : 0

      return {
        sessionId: session.id,
        sessionDate: new Date(session.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        firearm: session.firearms ? `${session.firearms.manufacturer} ${session.firearms.model}` : "Unknown",
        shotCount: velocities.length,
        mean: Math.round(avgVelocity),
        high: maxVelocity,
        low: minVelocity,
        es: Math.round(es),
        sd: Math.round(sd * 10) / 10,
        cv: Math.round(cv * 100) / 100,
      }
    })
    .filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Session Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Select sessions to analyze performance and compare results
          </p>
        </div>
        {isPremium && (
          <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-orange-500 w-fit">
            <Crown className="h-3 w-3 mr-1" />
            Premium Analytics
          </Badge>
        )}
      </div>

      {!isPremium && (
        <Card className="border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Unlock Premium Analytics
            </CardTitle>
            <CardDescription>
              Get advanced session analysis, shot-by-shot tracking, and comparison tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-500" />
                <span>Detailed shot distribution and POI analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-500" />
                <span>Compare multiple sessions side-by-side</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Velocity consistency tracking (SD & ES)</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-amber-500" />
                <span>Environmental impact analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <span>Performance trends over time</span>
              </div>
            </div>
            <Link href="/dashboard/settings">
              <Button className="w-full sm:w-auto">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {isPremium && (
        <>
          {/* Filters and Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="firearm-filter" className="text-sm font-medium mb-2 block">
                    Filter by Firearm
                  </Label>
                  <Select value={filterFirearm} onValueChange={setFilterFirearm}>
                    <SelectTrigger id="firearm-filter">
                      <SelectValue placeholder="All firearms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Firearms</SelectItem>
                      {firearms.map((firearm) => (
                        <SelectItem key={firearm.id} value={firearm.id}>
                          {firearm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="sort-by" className="text-sm font-medium mb-2 block">
                    Sort By
                  </Label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger id="sort-by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date (Newest First)</SelectItem>
                      <SelectItem value="groupSize">Best Group Size</SelectItem>
                      <SelectItem value="rounds">Most Rounds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedSessions.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedSessions.length} session{selectedSessions.length > 1 ? "s" : ""} selected
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSessions([])}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Selection List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Sessions to Analyze</CardTitle>
              <CardDescription>Choose one or more sessions to view detailed analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No sessions found. Start by adding shooting sessions!
                  </p>
                ) : (
                  filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent ${
                        selectedSessions.includes(session.id) ? "bg-accent border-primary" : ""
                      }`}
                      onClick={() => toggleSession(session.id)}
                    >
                      <Checkbox
                        checked={selectedSessions.includes(session.id)}
                        onCheckedChange={() => toggleSession(session.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {new Date(session.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {session.firearms && (
                            <Badge variant="outline" className="text-xs">
                              {session.firearms.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>{session.rounds_fired} rounds</span>
                          {session.group_size && <span>Group: {session.group_size}"</span>}
                          {session.shot_data && session.shot_data.length > 0 && (
                            <span>{session.shot_data.length} shots tracked</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analytics Display */}
          {selectedSessions.length > 0 && (
            <>
              {/* Comparison Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Session Comparison
                  </CardTitle>
                  <CardDescription>Side-by-side comparison of selected sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Date</th>
                          <th className="text-left p-2 font-medium">Firearm</th>
                          <th className="text-right p-2 font-medium">Group Size</th>
                          <th className="text-right p-2 font-medium">Rounds</th>
                          <th className="text-right p-2 font-medium">Avg Velocity</th>
                          <th className="text-right p-2 font-medium">SD</th>
                          <th className="text-right p-2 font-medium">ES</th>
                          <th className="text-right p-2 font-medium">Temp</th>
                          <th className="text-right p-2 font-medium">Wind</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.map((data) => (
                          <tr key={data.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">{data.date}</td>
                            <td className="p-2 text-muted-foreground">{data.firearm}</td>
                            <td className="p-2 text-right font-medium">
                              {data.groupSize ? `${data.groupSize}"` : "—"}
                            </td>
                            <td className="p-2 text-right">{data.rounds}</td>
                            <td className="p-2 text-right">{data.avgVelocity ? `${data.avgVelocity} fps` : "—"}</td>
                            <td className="p-2 text-right">{data.sd ? `${data.sd} fps` : "—"}</td>
                            <td className="p-2 text-right">{data.es ? `${data.es} fps` : "—"}</td>
                            <td className="p-2 text-right">{data.temperature ? `${data.temperature}°F` : "—"}</td>
                            <td className="p-2 text-right">{data.windSpeed ? `${data.windSpeed} mph` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {velocityStats.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {velocityStats.map((stats) => (
                    <Card key={stats!.sessionId}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Velocity Statistics
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {stats!.sessionDate} • {stats!.firearm}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Shot Count</p>
                            <p className="text-lg font-bold">{stats!.shotCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Mean Velocity</p>
                            <p className="text-lg font-bold">{stats!.mean} fps</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">High</p>
                            <p className="font-semibold text-green-600 dark:text-green-400">{stats!.high} fps</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Low</p>
                            <p className="font-semibold text-red-600 dark:text-red-400">{stats!.low} fps</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Std Dev (SD)</p>
                            <p className="font-semibold">{stats!.sd} fps</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Extreme Spread (ES)</p>
                            <p className="font-semibold">{stats!.es} fps</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Coefficient of Variation (CV)</p>
                            <p className="font-semibold">{stats!.cv}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Charts Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Group Size Comparison */}
                {comparisonData.some((d) => d.groupSize) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Group Size Comparison</CardTitle>
                      <CardDescription>Accuracy across selected sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={comparisonData.filter((d) => d.groupSize)}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                          <YAxis stroke="#888888" fontSize={11} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background p-3 shadow-md">
                                    <p className="text-sm font-medium">{payload[0].payload.date}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Group: <span className="font-bold text-foreground">{payload[0].value}"</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">{payload[0].payload.firearm}</p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Bar dataKey="groupSize" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {shotVelocityData.length > 0 && (
                  <Card className={comparisonData.some((d) => d.groupSize) ? "" : "md:col-span-2"}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Shot-by-Shot Velocity
                      </CardTitle>
                      <CardDescription>Individual round velocities with mean reference</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={shotVelocityData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="shotNumber"
                            stroke="#888888"
                            fontSize={11}
                            label={{ value: "Shot Number", position: "insideBottom", offset: -5, fontSize: 11 }}
                          />
                          <YAxis
                            stroke="#888888"
                            fontSize={11}
                            label={{ value: "Velocity (fps)", angle: -90, position: "insideLeft", fontSize: 11 }}
                            domain={["auto", "auto"]}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                const sessionStats = velocityStats.find((s) => s!.sessionId === data.sessionId)
                                return (
                                  <div className="rounded-lg border bg-background p-3 shadow-md">
                                    <p className="text-sm font-medium">Shot #{data.shotNumber}</p>
                                    <p className="text-sm">
                                      Velocity: <span className="font-bold">{data.velocity} fps</span>
                                    </p>
                                    {sessionStats && (
                                      <>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Mean: {sessionStats.mean} fps
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Δ: {data.velocity > sessionStats.mean ? "+" : ""}
                                          {data.velocity - sessionStats.mean} fps
                                        </p>
                                      </>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">{data.sessionDate}</p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          {/* Add mean reference line for single session */}
                          {selectedSessions.length === 1 && velocityStats[0] && (
                            <ReferenceLine
                              y={velocityStats[0].mean}
                              stroke="hsl(var(--muted-foreground))"
                              strokeDasharray="3 3"
                              label={{ value: `Mean: ${velocityStats[0].mean} fps`, position: "right", fontSize: 11 }}
                            />
                          )}
                          <Line
                            type="monotone"
                            dataKey="velocity"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ r: 4, fill: "hsl(var(--primary))" }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Shot Distribution (only for single session) */}
                {selectedSessions.length === 1 && shotDistributionData.length > 0 && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Shot Distribution (Point of Impact)
                      </CardTitle>
                      <CardDescription>
                        Horizontal and vertical shot placement for {selectedSessionData[0].firearms?.name || "session"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            type="number"
                            dataKey="x"
                            name="Horizontal"
                            unit='"'
                            stroke="#888888"
                            fontSize={11}
                            domain={["auto", "auto"]}
                          />
                          <YAxis
                            type="number"
                            dataKey="y"
                            name="Vertical"
                            unit='"'
                            stroke="#888888"
                            fontSize={11}
                            domain={["auto", "auto"]}
                          />
                          <ZAxis type="number" dataKey="shotNumber" range={[100, 400]} name="Shot #" />
                          <Tooltip
                            cursor={{ strokeDasharray: "3 3" }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background p-3 shadow-md">
                                    <p className="text-sm font-medium">Shot #{payload[0].payload.shotNumber}</p>
                                    <p className="text-xs text-muted-foreground">H: {payload[0].payload.x}"</p>
                                    <p className="text-xs text-muted-foreground">V: {payload[0].payload.y}"</p>
                                    {payload[0].payload.velocity && (
                                      <p className="text-xs text-muted-foreground">
                                        Velocity: {payload[0].payload.velocity} fps
                                      </p>
                                    )}
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Scatter data={shotDistributionData} fill="hsl(var(--primary))" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
