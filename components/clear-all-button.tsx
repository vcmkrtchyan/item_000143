"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useVolunteer } from "@/context/volunteer-context"
import { Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"

export function ClearAllButton() {
  const { clearAllActivities, activities } = useVolunteer()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  if (activities.length === 0) {
    return null
  }

  const handleClearAll = () => {
    console.log("Clear all button clicked, executing clearAllActivities")
    clearAllActivities()
    setIsOpen(false)

    toast({
      title: "Data cleared",
      description: "All volunteer activities have been deleted.",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear All Data</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Are you sure you want to delete all your volunteer activities? This action cannot be undone.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleClearAll}>
            Delete All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

