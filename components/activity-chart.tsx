"use client"

import { useEffect, useState } from "react"
import { useVolunteer } from "@/context/volunteer-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "lucide-react"
import mermaid from "mermaid"

export function ActivityChart() {
  const { activities } = useVolunteer()
  const [chartSvg, setChartSvg] = useState<string>("")

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "neutral",
      securityLevel: "loose",
    })

    if (activities.length > 0) {
      generateChart()
    }
  }, [activities])

  const generateChart = async () => {
    if (activities.length === 0) return

    // Group activities by organization
    const orgGroups = activities.reduce(
      (acc, activity) => {
        const org = activity.organization
        if (!acc[org]) {
          acc[org] = {
            totalMinutes: 0,
            activities: [],
          }
        }

        acc[org].totalMinutes += activity.hours * 60 + activity.minutes
        acc[org].activities.push(activity)

        return acc
      },
      {} as Record<string, { totalMinutes: number; activities: typeof activities }>,
    )

    // Create a pie chart definition
    let chartDefinition = "pie title Volunteer Hours by Organization\n"

    Object.entries(orgGroups).forEach(([org, data]) => {
      const hours = Math.floor(data.totalMinutes / 60)
      const minutes = data.totalMinutes % 60
      chartDefinition += `    "${org}" : ${data.totalMinutes}\n`
    })

    try {
      const { svg } = await mermaid.render("mermaid-chart", chartDefinition)
      setChartSvg(svg)
    } catch (error) {
      console.error("Error rendering mermaid chart:", error)
    }
  }

  if (activities.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          Activity Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartSvg ? (
          <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: chartSvg }} />
        ) : (
          <div className="h-40 flex items-center justify-center text-muted-foreground">Generating chart...</div>
        )}
      </CardContent>
    </Card>
  )
}

