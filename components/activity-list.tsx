"use client"

import { useState, useEffect } from "react"
import { useVolunteer } from "@/context/volunteer-context"
import { format } from "date-fns"
import { Edit, Trash2, GripVertical, Undo2 } from "lucide-react"
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

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

// Sortable activity row component
function SortableActivityRow({
  activity,
  onEdit,
  onDelete,
  isHighlighted,
}: {
  activity: VolunteerActivity
  onEdit: (activity: VolunteerActivity) => void
  onDelete: (activity: VolunteerActivity) => void
  isHighlighted: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id })

  const { formatDuration } = useActivityActions()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-colors",
        isDragging && "bg-muted/50 outline outline-2 outline-primary/20",
        isHighlighted && "animate-highlight",
      )}
    >
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Reorder</span>
        </Button>
      </TableCell>
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

// Main ActivityList component
export function ActivityList() {
  const { activities, reorderActivities } = useVolunteer()
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null)
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
  } = useActivityActions()

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = activities.findIndex((activity) => activity.id === active.id)
      const newIndex = activities.findIndex((activity) => activity.id === over.id)

      // Reorder activities
      reorderActivities(oldIndex, newIndex)
    }
  }

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={activities.map((activity) => activity.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {activities.map((activity) => (
                    <SortableActivityRow
                      key={activity.id}
                      activity={activity}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      isHighlighted={activity.id === highlightedActivityId}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
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

