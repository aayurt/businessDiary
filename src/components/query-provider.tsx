"use client"

import * as React from "react"
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import dynamic from "next/dynamic"

const ReactQueryDevtools = dynamic(
  () => import("@tanstack/react-query-devtools").then((m) => m.ReactQueryDevtools),
  { ssr: false },
)

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: true,
        retry: 1,
        networkMode: "offlineFirst",
      },
      mutations: {
        networkMode: "offlineFirst",
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    async function initPersistence() {
      const { persistQueryClient } = await import("@tanstack/query-persist-client-core")
      const { createSyncStoragePersister } = await import("@tanstack/query-sync-storage-persister")

      const persister = createSyncStoragePersister({
        storage: window.localStorage,
        key: "RQC_CACHE",
        throttleTime: 1000,
      })

      await persistQueryClient({
        queryClient,
        persister,
        maxAge: 1000 * 60 * 60 * 24,
      })
    }

    initPersistence()
    setMounted(true)
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {mounted && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
    </QueryClientProvider>
  )
}
