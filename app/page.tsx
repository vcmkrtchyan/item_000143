"use client"

import { useState } from "react"
import { VolunteerProvider } from "@/context/volunteer-context"
import { ActivityForm } from "@/components/activity-form"
import { ActivityList } from "@/components/activity-list"
import { SummaryCard } from "@/components/summary-card"
import { ActivityChart } from "@/components/activity-chart"
import { RestoreActivityButton } from "@/components/restore-activity-button"
import { ClearAllButton } from "@/components/clear-all-button"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function Home() {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)

  return (
    <VolunteerProvider>
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Volunteer Tracker</h1>
          <p className="text-muted-foreground">Track and manage your volunteer activities</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Log New Activity
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader className="pb-2">
                    <DialogTitle>Log Volunteer Hours</DialogTitle>
                  </DialogHeader>
                  <ActivityForm onComplete={() => setIsFormDialogOpen(false)} showTitle={false} />
                </DialogContent>
              </Dialog>

              <RestoreActivityButton />
            </div>

            <ActivityList />
          </div>

          <div className="space-y-6">
            <SummaryCard />
            <ActivityChart />
            <ClearAllButton />
          </div>
        </div>
      </div>
    </VolunteerProvider>
  )
}

