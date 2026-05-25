"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Hash } from "lucide-react"
import type { TagFrequency } from "@/types/analytics"

interface TagCloudProps {
  data: TagFrequency[]
}

export function TagCloud({ data }: TagCloudProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Hash className="h-4 w-4 text-muted-foreground" />
            Tag Cloud
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No tags found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Hash className="h-4 w-4 text-muted-foreground" />
          Tag Cloud
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {data.map((tag) => {
            const fontSize = 0.75 + tag.weight * 0.75
            const opacity = 0.4 + tag.weight * 0.6
            return (
              <span
                key={tag.slug}
                className="inline-block rounded-full bg-muted px-3 py-1 transition-colors hover:bg-primary/10"
                style={{
                  fontSize: `${fontSize}rem`,
                  opacity,
                }}
                title={`${tag.name}: ${tag.count} entries`}
              >
                {tag.name}
              </span>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
