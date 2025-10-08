"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RoleBadge } from "@/components/role-badge"
import { ManageRolesDialog } from "@/components/manage-roles-dialog"
import { Search, Settings } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface UserRole {
  id: string
  name: string
  display_name: string
  description: string
  assigned_at: string
  expires_at: string | null
}

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  subscription_status: string | null
  subscription_tier: string | null
  subscription_end_date: string | null
  created_at: string
  roles: UserRole[]
}

interface AdminUserTableProps {
  users: User[]
}

export function AdminUserTable({ users }: AdminUserTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [manageRolesOpen, setManageRolesOpen] = useState(false)

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.roles.some((role) => role.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleManageRoles = (user: User) => {
    setSelectedUser(user)
    setManageRolesOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email, name, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.full_name || "No name"}</span>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => <RoleBadge key={role.id} role={role.name} size="sm" />)
                      ) : (
                        <span className="text-sm text-muted-foreground">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.subscription_tier === "premium" ? (
                      <Badge variant="default">Premium</Badge>
                    ) : (
                      <Badge variant="outline">Basic</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleManageRoles(user)}>
                      <Settings className="h-4 w-4 mr-1" />
                      Manage Roles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <ManageRolesDialog open={manageRolesOpen} onOpenChange={setManageRolesOpen} user={selectedUser} />
      )}
    </div>
  )
}
