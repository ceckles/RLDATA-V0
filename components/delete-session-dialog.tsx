"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { ShootingSession } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface DeleteSessionDialogProps {
  session: ShootingSession
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteSessionDialog({ session, open, onOpenChange }: DeleteSessionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [returnRounds, setReturnRounds] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      if (returnRounds && session.ammunition_batch_id) {
        const { error: returnError } = await supabase.rpc("increment_ammunition_quantity", {
          batch_id: session.ammunition_batch_id,
          amount: session.rounds_fired,
        })

        if (returnError) {
          console.error("Error returning rounds to batch:", returnError)
          toast({
            title: "Warning",
            description: "Session deleted but failed to return rounds to batch.",
            variant: "destructive",
          })
        }
      }

      if (returnRounds && session.firearm_id) {
        const { error: firearmError } = await supabase.rpc("decrement_firearm_round_count", {
          firearm_uuid: session.firearm_id,
          amount: session.rounds_fired,
        })

        if (firearmError) {
          console.error("Error decrementing firearm round count:", firearmError)
          toast({
            title: "Warning",
            description: "Session deleted but failed to update firearm round count.",
            variant: "destructive",
          })
        }
      }

      const { error } = await supabase.from("shooting_sessions").delete().eq("id", session.id)

      if (error) throw error

      toast({
        title: "Session deleted",
        description: returnRounds
          ? `Session deleted and ${session.rounds_fired} rounds returned to batch.`
          : "Session deleted successfully.",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting session:", error)
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this shooting session from {new Date(session.date).toLocaleDateString()}?
            This will delete {session.rounds_fired} round
            {session.rounds_fired !== 1 ? "s" : ""} of data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {session.ammunition_batch_id && (
          <div className="flex items-center space-x-2 px-6">
            <Checkbox
              id="return-rounds"
              checked={returnRounds}
              onCheckedChange={(checked) => setReturnRounds(checked === true)}
            />
            <Label htmlFor="return-rounds" className="text-sm font-normal cursor-pointer">
              Return {session.rounds_fired} round{session.rounds_fired !== 1 ? "s" : ""} back to ammunition batch
            </Label>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
