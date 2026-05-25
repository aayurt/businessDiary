"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home } from "lucide-react"
import Link from "next/link"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 p-6 md:p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Dashboard crashed</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            An unexpected error occurred while loading the dashboard.
          </p>
          <div className="flex gap-3">
            <Button onClick={reset} variant="outline">
              Retry
            </Button>
            <Link href="/">
              <Button variant="secondary" className="gap-2">
                <Home className="h-4 w-4" />
                Go home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
