import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Shield, Star, Heart, FlaskConical, Crown } from "lucide-react"
import type { UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"

interface RoleBadgeProps {
  role: UserRole
  description?: string | null
  className?: string
  showIcon?: boolean
}

const roleConfig: Record<
  UserRole,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    className: string
    description: string
  }
> = {
  admin: {
    label: "Admin",
    icon: Crown,
    className:
      "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 hover:from-amber-600 hover:to-orange-700",
    description: "Full system access and user management",
  },
  moderator: {
    label: "Moderator",
    icon: Shield,
    className: "bg-blue-600 text-white border-0 hover:bg-blue-700",
    description: "Content moderation privileges",
  },
  subscriber: {
    label: "Subscriber",
    icon: Star,
    className: "bg-green-600 text-white border-0 hover:bg-green-700",
    description: "Active paid subscription member",
  },
  donator: {
    label: "Donator",
    icon: Heart,
    className: "bg-rose-600 text-white border-0 hover:bg-rose-700",
    description: "Supporter who made a donation",
  },
  tester: {
    label: "Tester",
    icon: FlaskConical,
    className: "bg-purple-600 text-white border-0 hover:bg-purple-700",
    description: "Beta testing and early access",
  },
}

export function RoleBadge({ role, description, className, showIcon = true }: RoleBadgeProps) {
  const config = roleConfig[role]
  const Icon = config.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn(config.className, "gap-1.5 font-medium", className)}>
            {showIcon && <Icon className="h-3 w-3" />}
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description || config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
