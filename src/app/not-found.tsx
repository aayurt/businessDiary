"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 min-h-screen">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
          <Link href="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
