"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function SignUpError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Sign up error:", error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Sign up unavailable</h2>
        <p className="text-sm text-muted-foreground">
          The registration page encountered an error. Please try again later.
        </p>
        <div className="flex gap-3">
          <Button onClick={reset} variant="outline">Retry</Button>
          <Link href="/"><Button variant="secondary">Go home</Button></Link>
        </div>
      </div>
    </div>
  )
}
