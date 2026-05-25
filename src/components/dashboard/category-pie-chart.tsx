"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { PieChartIcon } from "lucide-react"
import type { CategoryDistribution } from "@/types/analytics"

interface CategoryPieChartProps {
  data: CategoryDistribution[]
}

interface TooltipPayloadEntry {
  name: string
  value: number
  fill: string
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  if (!entry) return null
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <p className="text-sm font-medium">{entry.name}</p>
      <p className="text-xs text-muted-foreground">{entry.value} entries</p>
    </div>
  )
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            Category Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No categories found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          Category Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.slug} fill={entry.fill ?? "hsl(var(--chart-1))"} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {data.slice(0, 8).map((entry) => (
            <div key={entry.slug} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.fill ?? "hsl(var(--chart-1))" }}
              />
              <span className="text-xs text-muted-foreground">
                {entry.name} ({entry.count})
              </span>
            </div>
          ))}
          {data.length > 8 && (
            <span className="text-xs text-muted-foreground">+{data.length - 8} more</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
