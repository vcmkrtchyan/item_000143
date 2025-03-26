import * as z from "zod"

// Define the activity schema for form validation
export const activityFormSchema = z
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

export type ActivityFormValues = z.infer<typeof activityFormSchema>

