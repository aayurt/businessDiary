"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Cloud, CloudOff, Loader2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getOfflineQueue, replayOfflineQueue } from "@/lib/offline-queue"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function SyncButton() {
  const [syncing, setSyncing] = React.useState(false)
  const [pendingCount, setPendingCount] = React.useState(getOfflineQueue().length)
  const queryClient = useQueryClient()
  const syncingRef = React.useRef(false)

  const doSync = React.useCallback(async () => {
    if (!navigator.onLine) return
    if (syncingRef.current) return
    syncingRef.current = true
    setSyncing(true)

    await replayOfflineQueue(
      undefined,
      (results) => {
        if (results.length === 0) return
        const succeeded = results.filter((r) => r.success).length
        const failed = results.filter((r) => !r.success).length
        if (failed > 0) {
          toast.warning(`Synced ${succeeded}, ${failed} failed`)
        } else if (succeeded > 0) {
          toast.success(`Synced ${succeeded} change${succeeded === 1 ? "" : "s"}`)
        }
        setPendingCount(getOfflineQueue().length)
        queryClient.invalidateQueries()
      },
    )

    setSyncing(false)
    syncingRef.current = false
  }, [queryClient])

  // Check pending count periodically
  React.useEffect(() => {
    const check = () => setPendingCount(getOfflineQueue().length)
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto-sync: window.online + SW background sync message
  React.useEffect(() => {
    const handleOnline = () => doSync()

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_NOW') doSync()
    }

    window.addEventListener("online", handleOnline)
    navigator.serviceWorker?.addEventListener("message", handleSwMessage)

    return () => {
      window.removeEventListener("online", handleOnline)
      navigator.serviceWorker?.removeEventListener("message", handleSwMessage)
    }
  }, [doSync])

  // Auto-sync on mount if pending and online
  React.useEffect(() => {
    if (pendingCount > 0 && navigator.onLine) doSync()
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSync = async () => {
    if (!navigator.onLine) {
      toast.error("You are offline. Queued changes will sync when connected.")
      return
    }
    doSync()
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSync}
          disabled={syncing}
          className="h-8 w-8 relative"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : pendingCount > 0 ? (
            <CloudOff className="h-4 w-4 text-amber-500" />
          ) : (
            <Cloud className="h-4 w-4 text-green-500" />
          )}
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {syncing
          ? "Syncing..."
          : pendingCount > 0
            ? `${pendingCount} pending change${pendingCount === 1 ? "" : "s"} - Click to sync`
            : "All changes synced"}
      </TooltipContent>
    </Tooltip>
  )
}
