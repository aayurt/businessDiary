"use client"

import * as React from "react"
import { getOfflineQueue } from "@/lib/offline-queue"

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    const intervalRef: { current: ReturnType<typeof setInterval> | null } = { current: null }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          const syncManager = (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync
          if (syncManager) {
            const checkAndRegisterSync = () => {
              if (getOfflineQueue().length > 0) {
                syncManager.register("sync-mutations").catch(() => {})
              }
            }
            checkAndRegisterSync()
            intervalRef.current = setInterval(checkAndRegisterSync, 30000)
            navigator.serviceWorker.addEventListener("message", (event) => {
              if (event.data?.type === "SYNC_NOW") {
                setTimeout(checkAndRegisterSync, 2000)
              }
            })
          }
        })
        .catch(() => {})
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return null
}
