"use client"

import { Button } from "@/components/ui/button"
import { useVolunteer } from "@/context/volunteer-context"
import { Undo2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function RestoreActivityButton() {
  const { lastDeletedActivity, restoreLastDeletedActivity } = useVolunteer()
  const { toast } = useToast()

  if (!lastDeletedActivity) {
    return null
  }

  const handleRestore = () => {
    const activityName = lastDeletedActivity.activity.organization
    const restored = restoreLastDeletedActivity()

    if (restored) {
      // Toast is now shown inside restoreLastDeletedActivity
      console.log(`"${activityName}" has been restored`)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRestore} className="gap-1">
      <Undo2 className="h-4 w-4" />
      Restore Last Deleted Activity
    </Button>
  )
}

