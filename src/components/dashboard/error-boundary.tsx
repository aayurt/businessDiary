"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardErrorBoundaryProps {
  children: ReactNode
}

interface DashboardErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class DashboardErrorBoundary extends Component<DashboardErrorBoundaryProps, DashboardErrorBoundaryState> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("DashboardErrorBoundary caught:", error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-5">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Dashboard Error</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            {this.state.error?.message ?? "An unexpected error occurred while loading the dashboard."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try refreshing the page or go back to the home page.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Button variant="outline" onClick={this.handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Go home
              </Link>
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
