import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { DashboardErrorBoundary } from "@/components/dashboard/error-boundary"
import { AppSidebar } from "@/components/app-sidebar"

export const metadata = {
  title: "Investor Dashboard",
  description: "Analytics and insights across all entries",
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 md:pl-56 p-6 md:p-8">
        <DashboardErrorBoundary>
          <DashboardClient />
        </DashboardErrorBoundary>
      </main>
    </div>
  )
}
