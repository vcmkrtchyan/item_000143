"use client"

import { useState, useEffect } from "react"
import { useVolunteer } from "@/context/volunteer-context"
import { format } from "date-fns"
import { Edit, Trash2, Undo2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { ActivityForm } from "./activity-form"
import type { VolunteerActivity } from "@/types/volunteer"
import { useToast } from "@/hooks/use-toast"
import { globalActions } from "@/lib/global-actions"
import { eventBus } from "@/lib/event-bus"
import { cn } from "@/lib/utils"

// Define sort types
type SortField = "date" | "name" | "organization" | "duration"
type SortDirection = "asc" | "desc"

// Custom hook for activity actions
function useActivityActions() {
  const [editingActivity, setEditingActivity] = useState<VolunteerActivity | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [activityToDelete, setActivityToDelete] = useState<VolunteerActivity | null>(null)
  const { deleteActivity } = useVolunteer()
  const { toast } = useToast()

  const formatDuration = (hours: number, minutes: number) => {
    if (hours === 0) {
      return `${minutes} min`
    }
    if (minutes === 0) {
      return `${hours} hr`
    }
    return `${hours} hr ${minutes} min`
  }

  const handleEdit = (activity: VolunteerActivity) => {
    setEditingActivity(activity)
    setIsEditDialogOpen(true)
  }

  const handleEditComplete = () => {
    setIsEditDialogOpen(false)
    setEditingActivity(null)
  }

  const handleDeleteClick = (activity: VolunteerActivity) => {
    setActivityToDelete(activity)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (activityToDelete) {
      const deletedActivity = { ...activityToDelete }
      const activityName = deletedActivity.name || deletedActivity.organization

      // First delete the activity
      deleteActivity(deletedActivity.id)

      // Then show the toast with undo button
      toast({
        title: "Activity deleted",
        description: `"${activityName}" has been removed.`,
        action: (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => {
              console.log("Undo button clicked in toast")
              globalActions.restoreActivity()
            }}
          >
            <Undo2 className="h-4 w-4" /> Undo
          </Button>
        ),
        duration: 5000,
      })
    }

    setActivityToDelete(null)
    setIsDeleteDialogOpen(false)
  }

  return {
    editingActivity,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    activityToDelete,
    setActivityToDelete,
    handleEdit,
    handleEditComplete,
    handleDeleteClick,
    handleConfirmDelete,
    formatDuration,
  }
}

// Activity row component
function ActivityRow({
  activity,
  onEdit,
  onDelete,
  isHighlighted,
  formatDuration,
}: {
  activity: VolunteerActivity
  onEdit: (activity: VolunteerActivity) => void
  onDelete: (activity: VolunteerActivity) => void
  isHighlighted: boolean
  formatDuration: (hours: number, minutes: number) => string
}) {
  return (
    <TableRow className={cn("transition-colors", isHighlighted && "animate-highlight")}>
      <TableCell>{format(new Date(activity.date), "MMM d, yyyy")}</TableCell>
      <TableCell>{activity.name || "-"}</TableCell>
      <TableCell>{activity.organization}</TableCell>
      <TableCell className="max-w-[200px] truncate">{activity.description}</TableCell>
      <TableCell>{formatDuration(activity.hours, activity.minutes)}</TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(activity)}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(activity)}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// Sort header component
function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
}: {
  label: string
  field: SortField | null
  currentSort: { field: SortField; direction: SortDirection }
  onSort: (field: SortField) => void
}) {
  // Skip sort functionality for fields that are not sortable
  if (!field) {
    return <TableHead>{label}</TableHead>
  }

  const isActive = currentSort.field === field
  const icon = isActive ? (
    currentSort.direction === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    )
  ) : (
    <ArrowUpDown className="ml-1 h-4 w-4" />
  )

  return (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        className={cn("-ml-3 h-8 font-medium flex items-center", isActive ? "text-primary" : "text-muted-foreground")}
        onClick={() => onSort(field)}
      >
        {label}
        {icon}
      </Button>
    </TableHead>
  )
}

// Main ActivityList component
export function ActivityList() {
  const { activities } = useVolunteer()
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: "date",
    direction: "desc",
  })

  const {
    editingActivity,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    activityToDelete,
    setActivityToDelete,
    handleEdit,
    handleEditComplete,
    handleDeleteClick,
    handleConfirmDelete,
    formatDuration,
  } = useActivityActions()

  // Handle sort change
  const handleSort = (field: SortField) => {
    setSortConfig((prevConfig) => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === "asc" ? "desc" : "asc",
    }))
  }

  // Sort activities based on current sort configuration
  const sortedActivities = [...activities].sort((a, b) => {
    const { field, direction } = sortConfig
    const multiplier = direction === "asc" ? 1 : -1

    switch (field) {
      case "date":
        return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime())
      case "name":
        return multiplier * (a.name || "").localeCompare(b.name || "")
      case "organization":
        return multiplier * a.organization.localeCompare(b.organization)
      case "duration":
        const aDuration = a.hours * 60 + a.minutes
        const bDuration = b.hours * 60 + b.minutes
        return multiplier * (aDuration - bDuration)
      default:
        return 0
    }
  })

  // Listen for activity events (both new and restored)
  useEffect(() => {
    const handleActivityHighlight = (activityId: string) => {
      setHighlightedActivityId(activityId)

      // Remove highlight after animation completes
      setTimeout(() => {
        setHighlightedActivityId(null)
      }, 3000) // 3 seconds, matching the animation duration
    }

    // Listen for both added and restored events
    eventBus.on("activityAdded", handleActivityHighlight)
    eventBus.on("activityRestored", handleActivityHighlight)

    return () => {
      eventBus.off("activityAdded", handleActivityHighlight)
      eventBus.off("activityRestored", handleActivityHighlight)
    }
  }, [])

  if (activities.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center text-muted-foreground">
          No volunteer activities logged yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Volunteer Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader label="Date" field="date" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Name" field="name" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader
                  label="Organization"
                  field="organization"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <TableHead>Description</TableHead>
                <SortableHeader label="Duration" field="duration" currentSort={sortConfig} onSort={handleSort} />
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedActivities.map((activity) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  isHighlighted={activity.id === highlightedActivityId}
                  formatDuration={formatDuration}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-2">
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          {editingActivity && (
            <ActivityForm existingActivity={editingActivity} onComplete={handleEditComplete} showTitle={false} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this volunteer activity? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

