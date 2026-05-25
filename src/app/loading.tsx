import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8">
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-5 w-80 mb-8" />
      <div className="grid gap-4 text-sm w-full max-w-sm">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <div className="mt-8 flex gap-3">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </main>
  )
}
