import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { DashboardErrorBoundary } from "@/components/dashboard/error-boundary"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "Investor Dashboard",
  description: "Analytics and insights across all entries",
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <span className="text-sm font-medium">Dashboard</span>
      </header>
      <div className="p-6 md:p-8">
        <DashboardErrorBoundary>
          <DashboardClient />
        </DashboardErrorBoundary>
      </div>
    </div>
  )
}
