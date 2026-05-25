import { SkeletonCard, SkeletonChart, SkeletonTable } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonTable />
        <SkeletonChart />
      </div>
    </div>
  )
}
