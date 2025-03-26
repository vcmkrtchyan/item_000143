"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { VolunteerActivity, VolunteerContextType, DeletedActivityInfo } from "@/types/volunteer"
import { globalActions } from "@/lib/global-actions"
import { useToast } from "@/hooks/use-toast"
import { eventBus } from "@/lib/event-bus"

const VolunteerContext = createContext<VolunteerContextType | undefined>(undefined)

export function VolunteerProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<VolunteerActivity[]>([])
  const [lastDeletedActivity, setLastDeletedActivity] = useState<DeletedActivityInfo | null>(null)
  const { toast } = useToast()

  // Define the restore function
  const restoreLastDeletedActivity = useCallback(() => {
    console.log("Attempting to restore activity:", lastDeletedActivity)
    if (lastDeletedActivity) {
      // Create a copy to avoid any reference issues
      const activityToRestore = { ...lastDeletedActivity.activity }
      const position = lastDeletedActivity.position
      const activityName = activityToRestore.name || activityToRestore.organization

      // Update the activities state, inserting at the original position
      setActivities((prev) => {
        const newActivities = [...prev]
        // Ensure position is within bounds
        const insertPosition = Math.min(position, newActivities.length)
        newActivities.splice(insertPosition, 0, activityToRestore)
        return newActivities
      })

      // Clear the last deleted activity
      setLastDeletedActivity(null)

      // Show a simplified toast notification
      toast({
        title: "Activity restored",
        description: `"${activityName}" has been restored.`,
      })

      // Emit an event to highlight the restored row
      eventBus.emit("activityRestored", activityToRestore.id)

      console.log("Activity restored successfully to position", position)
      return true
    }
    console.log("No activity to restore")
    return false
  }, [lastDeletedActivity, toast])

  // Register the restore function globally
  useEffect(() => {
    globalActions.setRestoreActivityFn(restoreLastDeletedActivity)
  }, [restoreLastDeletedActivity])

  // Load data from localStorage on initial render
  useEffect(() => {
    // Load activities
    const savedActivities = localStorage.getItem("volunteerActivities")
    if (savedActivities) {
      try {
        setActivities(JSON.parse(savedActivities))
      } catch (e) {
        console.error("Error parsing saved activities:", e)
        setActivities([])
      }
    }

    // Load last deleted activity
    const savedLastDeleted = localStorage.getItem("volunteerLastDeletedActivity")
    if (savedLastDeleted) {
      try {
        setLastDeletedActivity(JSON.parse(savedLastDeleted))
      } catch (e) {
        console.error("Error parsing last deleted activity:", e)
        setLastDeletedActivity(null)
      }
    }
  }, [])

  // Save activities to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("volunteerActivities", JSON.stringify(activities))
  }, [activities])

  // Save last deleted activity to localStorage whenever it changes
  useEffect(() => {
    if (lastDeletedActivity) {
      localStorage.setItem("volunteerLastDeletedActivity", JSON.stringify(lastDeletedActivity))
    } else {
      localStorage.removeItem("volunteerLastDeletedActivity")
    }
  }, [lastDeletedActivity])

  const addActivity = (activity: Omit<VolunteerActivity, "id">) => {
    const newActivity = {
      ...activity,
      id: crypto.randomUUID(),
    }
    setActivities((prev) => [...prev, newActivity])

    // Emit an event with the new activity ID
    eventBus.emit("activityAdded", newActivity.id)
  }

  const deleteActivity = (id: string) => {
    setActivities((prev) => {
      const activityIndex = prev.findIndex((activity) => activity.id === id)

      if (activityIndex !== -1) {
        const activityToDelete = prev[activityIndex]
        console.log("Setting last deleted activity:", activityToDelete, "at position", activityIndex)

        // Store both the activity and its position
        setLastDeletedActivity({
          activity: activityToDelete,
          position: activityIndex,
        })

        // Return the filtered array
        return prev.filter((_, index) => index !== activityIndex)
      }

      return prev
    })
  }

  const editActivity = (updatedActivity: VolunteerActivity) => {
    setActivities((prev) => prev.map((activity) => (activity.id === updatedActivity.id ? updatedActivity : activity)))
  }

  const getTotalHours = () => {
    const totalMinutes = activities.reduce((total, activity) => total + activity.hours * 60 + activity.minutes, 0)

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
    }
  }

  const clearAllActivities = useCallback(() => {
    console.log("clearAllActivities function called")
    // Clear the activities state
    setActivities([])
    // Clear the last deleted activity
    setLastDeletedActivity(null)
    // Clear localStorage
    try {
      localStorage.removeItem("volunteerActivities")
      localStorage.removeItem("volunteerLastDeletedActivity")
      console.log("localStorage cleared")
    } catch (error) {
      console.error("Error clearing localStorage:", error)
    }
    console.log("Activities cleared successfully")
  }, [])

  return (
    <VolunteerContext.Provider
      value={{
        activities,
        addActivity,
        deleteActivity,
        editActivity,
        getTotalHours,
        clearAllActivities,
        lastDeletedActivity,
        restoreLastDeletedActivity,
      }}
    >
      {children}
    </VolunteerContext.Provider>
  )
}

export function useVolunteer() {
  const context = useContext(VolunteerContext)
  if (context === undefined) {
    throw new Error("useVolunteer must be used within a VolunteerProvider")
  }
  return context
}

