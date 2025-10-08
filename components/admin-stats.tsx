import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Crown, Shield, UserCheck } from "lucide-react"

interface AdminStatsProps {
  totalUsers: number
  premiumUsers: number
  adminUsers: number
  subscriberUsers: number
}

export function AdminStats({ totalUsers, premiumUsers, adminUsers, subscriberUsers }: AdminStatsProps) {
  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      description: "Registered accounts",
      icon: Users,
    },
    {
      title: "Premium Users",
      value: premiumUsers,
      description: "Active subscriptions",
      icon: Crown,
    },
    {
      title: "Administrators",
      value: adminUsers,
      description: "Admin role assigned",
      icon: Shield,
    },
    {
      title: "Subscribers",
      value: subscriberUsers,
      description: "Subscriber role assigned",
      icon: UserCheck,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
