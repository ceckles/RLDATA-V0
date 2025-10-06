"use client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Component } from "@/lib/types"
import { toast } from "sonner"

interface DeleteAmmunitionBatchButtonProps {
  batch: any
  components: Component[]
}

export function DeleteAmmunitionBatchButton({ batch, components }: DeleteAmmunitionBatchButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [returnComponents, setReturnComponents] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    try {
      if (batch.ammunition_type === "handload" && returnComponents) {
        const updates = []

        // Return primers
        if (batch.primer_id) {
          const primer = components.find((c) => c.id === batch.primer_id)
          if (primer) {
            updates.push(
              supabase
                .from("components")
                .update({ quantity: primer.quantity + batch.quantity })
                .eq("id", batch.primer_id),
            )
          }
        }

        // Return powder
        if (batch.powder_id && batch.charge_weight_grains) {
          const powder = components.find((c) => c.id === batch.powder_id)
          if (powder) {
            const chargeWeight = batch.charge_weight_grains
            const totalPowderUsed =
              powder.weight_unit === "lb"
                ? (chargeWeight * batch.quantity) / 7000
                : (chargeWeight * batch.quantity) / 15.432

            updates.push(
              supabase
                .from("components")
                .update({ quantity: powder.quantity + totalPowderUsed })
                .eq("id", batch.powder_id),
            )
          }
        }

        // Return bullets
        if (batch.bullet_id) {
          const bullet = components.find((c) => c.id === batch.bullet_id)
          if (bullet) {
            updates.push(
              supabase
                .from("components")
                .update({ quantity: bullet.quantity + batch.quantity })
                .eq("id", batch.bullet_id),
            )
          }
        }

        // Return brass
        if (batch.brass_id) {
          const brass = components.find((c) => c.id === batch.brass_id)
          if (brass) {
            updates.push(
              supabase
                .from("components")
                .update({ quantity: brass.quantity + batch.quantity })
                .eq("id", batch.brass_id),
            )
          }
        }

        await Promise.all(updates)
      }

      // Delete the batch
      const { error } = await supabase.from("ammunition_batches").delete().eq("id", batch.id)

      if (error) throw error

      const message =
        batch.ammunition_type === "factory"
          ? "Ammunition batch deleted"
          : returnComponents
            ? "Ammunition batch deleted and components returned to inventory"
            : "Ammunition batch deleted"
      toast.success(message)
      router.refresh()
    } catch (error) {
      console.error("Error deleting ammunition batch:", error)
      toast.error("Failed to delete ammunition batch")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 bg-transparent"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Ammunition Batch?</AlertDialogTitle>
          <AlertDialogDescription>
            {batch.ammunition_type === "factory" ? (
              <>
                This will permanently delete batch "{batch.batch_number}" containing{" "}
                {batch.quantity_remaining || batch.quantity} rounds.
              </>
            ) : (
              <>
                This will permanently delete batch "{batch.batch_number}".
                <span className="block mt-2">
                  This batch contains {batch.quantity} rounds worth of components (primers, powder, bullets, and brass).
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {batch.ammunition_type === "handload" && (
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="return-components"
              checked={returnComponents}
              onCheckedChange={(checked) => setReturnComponents(checked as boolean)}
            />
            <Label
              htmlFor="return-components"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Return components to inventory
            </Label>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
