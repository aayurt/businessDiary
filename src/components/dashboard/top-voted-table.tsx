"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, ArrowUp } from "lucide-react"
import type { TopVotedEntry } from "@/types/analytics"
import { cn } from "@/lib/utils"

interface TopVotedTableProps {
  data: TopVotedEntry[]
}

const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-700"]

export function TopVotedTable({ data }: TopVotedTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            Top Voted Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No entries with votes yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Top Voted Entries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  index < 3
                    ? `${rankColors[index] ?? ""} bg-muted`
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.title}</p>
                {entry.authorName && (
                  <p className="text-xs text-muted-foreground">{entry.authorName}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                {entry.voteCount}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
