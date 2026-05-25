"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, FileText, ArrowUp, MessageSquare, DollarSign, TrendingUp } from "lucide-react"
import type { ActivityEvent } from "@/types/analytics"

interface ActivityFeedProps {
  data: ActivityEvent[]
}

const typeConfig: Record<
  ActivityEvent["type"],
  { icon: typeof FileText; color: string; bg: string }
> = {
  create: { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
  vote: { icon: ArrowUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  comment: { icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-500/10" },
  budget: { icon: DollarSign, color: "text-amber-500", bg: "bg-amber-500/10" },
  investment: { icon: TrendingUp, color: "text-rose-500", bg: "bg-rose-500/10" },
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function ActivityFeed({ data }: ActivityFeedProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[350px] overflow-y-auto">
        <div className="space-y-1">
          {data.map((event) => {
            const config = typeConfig[event.type]
            const Icon = config.icon
            return (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}
                >
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{event.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.userName ?? "Anonymous"} &middot; {formatTimeAgo(event.timestamp)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
