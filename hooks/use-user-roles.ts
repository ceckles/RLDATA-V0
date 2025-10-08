"use client"

import useSWR from "swr"
import type { UserRoleWithDetails } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useUserRoles() {
  const { data, error, isLoading, mutate } = useSWR<{ roles: UserRoleWithDetails[] }>("/api/roles", fetcher)

  return {
    roles: data?.roles || [],
    roleNames: data?.roles.map((r) => r.role_name) || [],
    isLoading,
    isError: error,
    mutate,
  }
}
