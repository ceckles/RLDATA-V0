import { RoleBadge } from "@/components/role-badge"
import type { UserRoleWithDetails } from "@/lib/types"

interface RoleBadgesListProps {
  roles: UserRoleWithDetails[]
  className?: string
}

export function RoleBadgesList({ roles, className }: RoleBadgesListProps) {
  if (!roles || roles.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => {
          if (!role || !role.role_name) {
            console.error("[v0] Invalid role data:", role)
            return null
          }
          return <RoleBadge key={role.role_name} role={role.role_name as any} description={role.role_description} />
        })}
      </div>
    </div>
  )
}
