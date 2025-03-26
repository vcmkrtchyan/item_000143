"use client"

import { useVolunteer } from "@/context/volunteer-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Clock, Award, BarChart } from "lucide-react"
import { format } from "date-fns"

export function SummaryCard() {
  const { activities, getTotalHours } = useVolunteer()
  const { hours, minutes } = getTotalHours()

  const generateReport = () => {
    // Create a summary text
    let report = "# Volunteer Activity Summary\n\n"
    report += `Generated on: ${format(new Date(), "MMMM d, yyyy")}\n\n`
    report += `## Total Hours: ${hours} hours and ${minutes} minutes\n\n`
    report += `## Activities (${activities.length}):\n\n`

    activities.forEach((activity, index) => {
      report += `### ${index + 1}. ${activity.name || "Unnamed Activity"} - ${activity.organization}\n`
      report += `Date: ${format(new Date(activity.date), "MMMM d, yyyy")}\n`
      report += `Duration: ${activity.hours} hours and ${activity.minutes} minutes\n`
      report += `Description: ${activity.description}\n\n`
    })

    // Create a downloadable file
    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `volunteer-summary-${format(new Date(), "yyyy-MM-dd")}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Volunteer Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Total Time:</span>
          </div>
          <span className="text-xl font-bold">
            {hours} hr {minutes} min
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Activities:</span>
          </div>
          <span className="text-xl font-bold">{activities.length}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={generateReport} disabled={activities.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Download Summary
        </Button>
      </CardFooter>
    </Card>
  )
}

