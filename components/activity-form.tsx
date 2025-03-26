"use client"

import { useState } from "react"
import { useVolunteer } from "@/context/volunteer-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { VolunteerActivity } from "@/types/volunteer"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

interface ActivityFormProps {
  existingActivity?: VolunteerActivity
  onComplete?: () => void
  showTitle?: boolean
}

// Define the form schema with Zod
const formSchema = z
  .object({
    name: z.string().min(1, "Activity name is required"),
    organization: z.string().min(1, "Organization name is required"),
    description: z.string().min(1, "Description is required"),
    date: z.date({
      required_error: "Please select a date",
    }),
    hours: z.coerce.number().min(0, "Hours must be 0 or greater"),
    minutes: z.coerce.number().min(0, "Minutes must be 0 or greater").max(59, "Minutes must be less than 60"),
  })
  .refine((data) => data.hours > 0 || data.minutes > 0, {
    message: "Duration must be greater than 0",
    path: ["hours"], // Show error on the hours field
  })

export function ActivityForm({ existingActivity, onComplete, showTitle = true }: ActivityFormProps) {
  const { addActivity, editActivity } = useVolunteer()
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Initialize the form with default values or existing activity values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingActivity?.name || "",
      organization: existingActivity?.organization || "",
      description: existingActivity?.description || "",
      date: existingActivity ? new Date(existingActivity.date) : new Date(),
      hours: existingActivity?.hours || 0,
      minutes: existingActivity?.minutes || 0,
    },
  })

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    const activity = {
      name: values.name,
      organization: values.organization,
      description: values.description,
      date: values.date.toISOString(),
      hours: values.hours,
      minutes: values.minutes,
    }

    if (existingActivity) {
      editActivity({ ...activity, id: existingActivity.id })
    } else {
      addActivity(activity)
      form.reset({
        name: "",
        organization: "",
        description: "",
        date: new Date(),
        hours: 0,
        minutes: 0,
      })
    }

    if (onComplete) {
      onComplete()
    }
  }

  // Handle date selection with Firefox compatibility
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue("date", date)
      setCalendarOpen(false)
    }
  }

  // Check if there's a duration error
  const hasDurationError = form.formState.errors.hours?.message === "Duration must be greater than 0"

  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader>
          <CardTitle>{existingActivity ? "Edit Activity" : "Log Volunteer Hours"}</CardTitle>
        </CardHeader>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className={cn("space-y-4", !showTitle && "pt-2")}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Activity name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <FormControl>
                    <Input placeholder="Organization name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your volunteer activity" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                          onClick={() => setCalendarOpen(true)}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={handleDateSelect}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Duration</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Hours"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value, 10)
                            field.onChange(isNaN(value) ? 0 : value)
                          }}
                          onClick={(e) => e.currentTarget.select()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minutes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="Minutes"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value, 10)
                            field.onChange(isNaN(value) ? 0 : value)
                          }}
                          onClick={(e) => e.currentTarget.select()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {hasDurationError && (
                <p className="text-sm font-medium text-destructive">Duration must be greater than 0</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="pb-4">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {existingActivity ? "Update Activity" : "Log Hours"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

