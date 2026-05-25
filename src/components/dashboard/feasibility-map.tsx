"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Globe } from "lucide-react"

interface LocationEntry {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  fileTitle: string
  fileSlug: string
}

interface FeasibilityMapProps {
  locations: LocationEntry[]
  totalLocations: number
}

export function FeasibilityMap({ locations, totalLocations }: FeasibilityMapProps) {
  if (totalLocations === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Feasibility Map Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No locations registered yet.</p>
        </CardContent>
      </Card>
    )
  }

  const hasCoords = locations.some((l) => l.latitude != null && l.longitude != null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Globe className="h-4 w-4 text-muted-foreground" />
          Feasibility Map Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{totalLocations} location{totalLocations !== 1 ? "s" : ""} registered</span>
          </div>

          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{loc.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{loc.fileTitle}</p>
                  {loc.address && (
                    <p className="text-xs text-muted-foreground truncate">{loc.address}</p>
                  )}
                  {hasCoords && loc.latitude != null && loc.longitude != null && (
                    <p className="text-xs text-muted-foreground">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
