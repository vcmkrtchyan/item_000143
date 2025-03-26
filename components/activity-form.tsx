"use client"

import type React from "react"

import { useState } from "react"
import { useVolunteer } from "@/context/volunteer-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { VolunteerActivity } from "@/types/volunteer"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ActivityFormProps {
  existingActivity?: VolunteerActivity
  onComplete?: () => void
  showTitle?: boolean // New prop to control title visibility
}

export function ActivityForm({ existingActivity, onComplete, showTitle = true }: ActivityFormProps) {
  const { addActivity, editActivity } = useVolunteer()
  const [date, setDate] = useState<Date | undefined>(existingActivity ? new Date(existingActivity.date) : new Date())
  const [name, setName] = useState(existingActivity?.name || "")
  const [organization, setOrganization] = useState(existingActivity?.organization || "")
  const [description, setDescription] = useState(existingActivity?.description || "")
  const [hours, setHours] = useState(existingActivity?.hours.toString() || "0")
  const [minutes, setMinutes] = useState(existingActivity?.minutes.toString() || "0")
  const [error, setError] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that at least some time is logged
    const hoursNum = Number.parseInt(hours) || 0
    const minutesNum = Number.parseInt(minutes) || 0

    if (hoursNum === 0 && minutesNum === 0) {
      setError("Please enter a duration greater than 0")
      return
    }

    const activity = {
      name,
      organization,
      description,
      date: date?.toISOString() || new Date().toISOString(),
      hours: hoursNum,
      minutes: minutesNum,
    }

    if (existingActivity) {
      editActivity({ ...activity, id: existingActivity.id })
    } else {
      addActivity(activity)
    }

    // Reset form if not editing
    if (!existingActivity) {
      setName("")
      setOrganization("")
      setDescription("")
      setHours("0")
      setMinutes("0")
    }

    setError(null)

    if (onComplete) {
      onComplete()
    }
  }

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setHours(value)
    // Clear error if user is typing
    if (error && (Number.parseInt(value) > 0 || Number.parseInt(minutes) > 0)) {
      setError(null)
    }
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Ensure minutes are between 0-59
    if (Number.parseInt(value) >= 0 && Number.parseInt(value) <= 59) {
      setMinutes(value)
      // Clear error if user is typing
      if (error && (Number.parseInt(hours) > 0 || Number.parseInt(value) > 0)) {
        setError(null)
      }
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setCalendarOpen(false) // Close the popover when a date is selected
  }

  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader>
          <CardTitle>{existingActivity ? "Edit Activity" : "Log Volunteer Hours"}</CardTitle>
        </CardHeader>
      )}
      <form onSubmit={handleSubmit}>
        <CardContent className={cn("space-y-4", !showTitle && "pt-2")}>
          <div className="space-y-2">
            <Label htmlFor="name">Activity Name</Label>
            <Input
              id="name"
              placeholder="Activity name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              placeholder="Organization name"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Activity Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your volunteer activity"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="hours" className="sr-only">
                    Hours
                  </Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    placeholder="Hours"
                    value={hours}
                    onChange={handleHoursChange}
                    onClick={(e) => e.currentTarget.select()}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minutes" className="sr-only">
                    Minutes
                  </Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Minutes"
                    value={minutes}
                    onChange={handleMinutesChange}
                    onClick={(e) => e.currentTarget.select()}
                    required
                  />
                </div>
              </div>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="pb-4">
          <Button type="submit" className="w-full">
            {existingActivity ? "Update Activity" : "Log Hours"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

