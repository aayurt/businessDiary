import { Skeleton } from "@/components/ui/skeleton"

export default function SignUpLoading() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-36 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <Skeleton className="h-4 w-56 mx-auto" />
      </div>
    </div>
  )
}
