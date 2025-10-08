"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ShootingSession } from "@/lib/types"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Scatter,
  ScatterChart,
  ZAxis,
  Legend,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts"
import { TrendingUp, Wind, Target, Zap, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PremiumAnalyticsProps {
  sessions: (ShootingSession & {
    firearms: { manufacturer: string; model: string; caliber: string } | null
    shot_data?: Array<{
      velocity: number | null
      group_size: number | null
      distance: number
    }>
  })[]
}

export function PremiumAnalytics({ sessions }: PremiumAnalyticsProps) {
  // Accuracy trend over time
  const accuracyTrend = sessions
    .filter((s) => s.group_size)
    .slice(0, 20)
    .reverse()
    .map((session, index) => ({
      session: index + 1,
      groupSize: session.group_size,
      date: new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      rounds: session.rounds_fired,
    }))

  // Environmental impact on accuracy
  const environmentalData = sessions
    .filter((s) => s.group_size && (s.temperature || s.wind_speed))
    .map((session) => ({
      temperature: session.temperature || 0,
      windSpeed: session.wind_speed || 0,
      groupSize: session.group_size,
      date: new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }))

  // Velocity analysis (from shot_data)
  const velocityData = sessions
    .filter((s) => s.shot_data && s.shot_data.some((shot) => shot.velocity))
    .slice(0, 15)
    .reverse()
    .map((session) => {
      const velocities = session.shot_data?.filter((shot) => shot.velocity).map((shot) => shot.velocity!) || []
      const avgVelocity = velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0
      const maxVelocity = velocities.length > 0 ? Math.max(...velocities) : 0
      const minVelocity = velocities.length > 0 ? Math.min(...velocities) : 0
      const es = maxVelocity - minVelocity // Extreme Spread
      const sd =
        velocities.length > 1
          ? Math.sqrt(velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length)
          : 0

      return {
        date: new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        avgVelocity: Math.round(avgVelocity),
        es,
        sd: Math.round(sd),
        firearm: session.firearms ? `${session.firearms.manufacturer} ${session.firearms.model}` : "Unknown",
      }
    })

  // Performance by firearm
  const performanceByFirearm = sessions.reduce(
    (acc, session) => {
      const firearmName = session.firearms ? `${session.firearms.manufacturer} ${session.firearms.model}` : "Unknown"
      if (!acc[firearmName]) {
        acc[firearmName] = {
          firearm: firearmName,
          sessions: 0,
          totalRounds: 0,
          avgGroupSize: 0,
          groupSizes: [],
        }
      }
      acc[firearmName].sessions++
      acc[firearmName].totalRounds += session.rounds_fired
      if (session.group_size) {
        acc[firearmName].groupSizes.push(session.group_size)
      }
      return acc
    },
    {} as Record<
      string,
      {
        firearm: string
        sessions: number
        totalRounds: number
        avgGroupSize: number
        groupSizes: number[]
      }
    >,
  )

  const performanceData = Object.values(performanceByFirearm)
    .map((data) => ({
      ...data,
      avgGroupSize:
        data.groupSizes.length > 0
          ? Number((data.groupSizes.reduce((a, b) => a + b, 0) / data.groupSizes.length).toFixed(2))
          : 0,
      firearm: data.firearm.length > 25 ? data.firearm.substring(0, 25) + "..." : data.firearm,
    }))
    .sort((a, b) => a.avgGroupSize - b.avgGroupSize)

  // Monthly activity and performance
  const monthlyData = sessions.reduce(
    (acc, session) => {
      const month = new Date(session.date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      if (!acc[month]) {
        acc[month] = {
          month,
          sessions: 0,
          rounds: 0,
          groupSizes: [],
        }
      }
      acc[month].sessions++
      acc[month].rounds += session.rounds_fired
      if (session.group_size) {
        acc[month].groupSizes.push(session.group_size)
      }
      return acc
    },
    {} as Record<string, { month: string; sessions: number; rounds: number; groupSizes: number[] }>,
  )

  const monthlyChartData = Object.values(monthlyData)
    .map((data) => ({
      month: data.month,
      sessions: data.sessions,
      rounds: data.rounds,
      avgGroupSize:
        data.groupSizes.length > 0
          ? Number((data.groupSizes.reduce((a, b) => a + b, 0) / data.groupSizes.length).toFixed(2))
          : null,
    }))
    .slice(-12)

  // Calculate overall statistics
  const totalSessions = sessions.length
  const totalRounds = sessions.reduce((sum, s) => sum + s.rounds_fired, 0)
  const sessionsWithGroupSize = sessions.filter((s) => s.group_size)
  const avgGroupSize =
    sessionsWithGroupSize.length > 0
      ? (sessionsWithGroupSize.reduce((sum, s) => sum + (s.group_size || 0), 0) / sessionsWithGroupSize.length).toFixed(
          2,
        )
      : "N/A"
  const bestGroupSize =
    sessionsWithGroupSize.length > 0
      ? Math.min(...sessionsWithGroupSize.map((s) => s.group_size || Number.POSITIVE_INFINITY)).toFixed(2)
      : "N/A"

  return (
    <div className="space-y-6">
      {/* Premium Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-orange-500">
          <TrendingUp className="h-3 w-3 mr-1" />
          Premium Analytics
        </Badge>
        <p className="text-sm text-muted-foreground">Advanced performance insights and trends</p>
      </div>

      {/* Key Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">{totalRounds.toLocaleString()} rounds fired</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Avg Group Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgGroupSize}"</div>
            <p className="text-xs text-muted-foreground">Across {sessionsWithGroupSize.length} sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Best Group
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestGroupSize}"</div>
            <p className="text-xs text-muted-foreground">Personal best</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Velocity Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{velocityData.length}</div>
            <p className="text-xs text-muted-foreground">Sessions with velocity tracking</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Accuracy Trend */}
        {accuracyTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Accuracy Trend
              </CardTitle>
              <CardDescription>Group size over last {accuracyTrend.length} sessions (inches)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={accuracyTrend}>
                  <defs>
                    <linearGradient id="groupSizeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{payload[0].payload.date}</p>
                              <p className="text-sm text-muted-foreground">
                                Group Size: <span className="font-bold text-foreground">{payload[0].value}"</span>
                              </p>
                              <p className="text-xs text-muted-foreground">{payload[0].payload.rounds} rounds fired</p>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="groupSize"
                    stroke="hsl(var(--primary))"
                    fill="url(#groupSizeGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Performance by Firearm */}
        {performanceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance by Firearm</CardTitle>
              <CardDescription>Average group size comparison (inches)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" stroke="#888888" fontSize={11} />
                  <YAxis dataKey="firearm" type="category" stroke="#888888" fontSize={10} width={100} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{payload[0].payload.firearm}</p>
                              <p className="text-sm text-muted-foreground">
                                Avg Group: <span className="font-bold text-foreground">{payload[0].value}"</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {payload[0].payload.sessions} sessions • {payload[0].payload.totalRounds} rounds
                              </p>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="avgGroupSize" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Velocity Analysis */}
        {velocityData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Velocity Consistency
              </CardTitle>
              <CardDescription>Average velocity and standard deviation (fps)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{payload[0].payload.date}</p>
                              <p className="text-sm text-muted-foreground">
                                Avg Velocity: <span className="font-bold text-foreground">{payload[0].value} fps</span>
                              </p>
                              <p className="text-xs text-muted-foreground">SD: {payload[0].payload.sd} fps</p>
                              <p className="text-xs text-muted-foreground">ES: {payload[0].payload.es} fps</p>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgVelocity"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Environmental Impact */}
        {environmentalData.length > 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wind className="h-5 w-5" />
                Environmental Impact
              </CardTitle>
              <CardDescription>Temperature vs wind speed vs group size</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    dataKey="temperature"
                    name="Temperature"
                    unit="°F"
                    stroke="#888888"
                    fontSize={11}
                  />
                  <YAxis
                    type="number"
                    dataKey="windSpeed"
                    name="Wind Speed"
                    unit=" mph"
                    stroke="#888888"
                    fontSize={11}
                  />
                  <ZAxis type="number" dataKey="groupSize" range={[50, 400]} name="Group Size" unit='"' />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{payload[0].payload.date}</p>
                              <p className="text-xs text-muted-foreground">Temp: {payload[0].payload.temperature}°F</p>
                              <p className="text-xs text-muted-foreground">Wind: {payload[0].payload.windSpeed} mph</p>
                              <p className="text-xs text-muted-foreground">Group: {payload[0].payload.groupSize}"</p>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Scatter data={environmentalData} fill="hsl(var(--primary))" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Monthly Activity */}
        {monthlyChartData.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Activity & Performance
              </CardTitle>
              <CardDescription>Sessions, rounds fired, and average group size by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="roundsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{payload[0].payload.month}</p>
                              <p className="text-sm text-muted-foreground">
                                Sessions: <span className="font-bold text-foreground">{payload[0].value}</span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Rounds: <span className="font-bold text-foreground">{payload[0].payload.rounds}</span>
                              </p>
                              {payload[0].payload.avgGroupSize && (
                                <p className="text-sm text-muted-foreground">
                                  Avg Group:{" "}
                                  <span className="font-bold text-foreground">{payload[0].payload.avgGroupSize}"</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="hsl(var(--primary))"
                    fill="url(#sessionsGradient)"
                    strokeWidth={2}
                    name="Sessions"
                  />
                  <Area
                    type="monotone"
                    dataKey="rounds"
                    stroke="hsl(var(--chart-2))"
                    fill="url(#roundsGradient)"
                    strokeWidth={2}
                    name="Rounds"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
