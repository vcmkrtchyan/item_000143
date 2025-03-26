export interface VolunteerActivity {
  id: string
  name: string
  organization: string
  description: string
  date: string
  hours: number
  minutes: number
}

export interface DeletedActivityInfo {
  activity: VolunteerActivity
  position: number
}

export interface VolunteerContextType {
  activities: VolunteerActivity[]
  addActivity: (activity: Omit<VolunteerActivity, "id">) => void
  deleteActivity: (id: string) => void
  editActivity: (activity: VolunteerActivity) => void
  getTotalHours: () => { hours: number; minutes: number }
  clearAllActivities: () => void
  lastDeletedActivity: DeletedActivityInfo | null
  restoreLastDeletedActivity: () => boolean
}

