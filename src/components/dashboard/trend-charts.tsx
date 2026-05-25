"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, BarChart3 } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import type { TrendsData } from "@/types/analytics"

interface TrendChartsProps {
  data: TrendsData
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

interface TooltipPayloadEntry {
  name: string
  value: number
  dataKey: string
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}) {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <p className="text-xs text-muted-foreground">{formatDateLabel(label)}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-medium">
          {entry.value} {entry.dataKey === "entries" ? "entries" : "votes"}
        </p>
      ))}
    </div>
  )
}

export function TrendCharts({ data }: TrendChartsProps) {
  const { entriesOverTime, votesOverTime } = data

  const mergedData = entriesOverTime.map((ep, i) => ({
    date: ep.date,
    entries: ep.count,
    votes: votesOverTime[i]?.count ?? 0,
  }))

  const hasEntriesData = entriesOverTime.some((d) => d.count > 0)
  const hasVotesData = votesOverTime.some((d) => d.count > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Trends (Last 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <h4 className="text-sm font-medium">Entries Over Time</h4>
            </div>
            <div className="h-[180px]">
              {!hasEntriesData ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">No entry data yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mergedData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                      className="text-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="entries"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <h4 className="text-sm font-medium">Votes Over Time</h4>
            </div>
            <div className="h-[180px]">
              {!hasVotesData ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">No vote data yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mergedData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                      className="text-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="votes"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
