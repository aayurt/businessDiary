import { useQuery, useMutation } from "@tanstack/react-query"
import type {
  DashboardSummary,
  TopVotedEntry,
  CategoryDistribution,
  TagFrequency,
  ActivityEvent,
  TrendsData,
} from "@/types/analytics"

interface LocationEntry {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  fileTitle: string
  fileSlug: string
}

export interface DashboardData {
  summary: DashboardSummary | null
  topVoted: TopVotedEntry[]
  categoryDistribution: CategoryDistribution[]
  tagCloud: TagFrequency[]
  activityFeed: ActivityEvent[]
  trends: TrendsData | null
  locations: LocationEntry[]
}

const ANALYTICS_KEY = ["analytics"]

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? `Failed to fetch ${url}`)
  return json.data as T
}

export function useDashboardData() {
  return useQuery({
    queryKey: ANALYTICS_KEY,
    queryFn: async (): Promise<DashboardData> => {
      const [summary, topVoted, categoryDistribution, tagCloud, activityFeed, trends, locations] =
        await Promise.all([
          fetchJson<DashboardSummary>("/api/analytics/summary"),
          fetchJson<TopVotedEntry[]>("/api/analytics/top-voted"),
          fetchJson<CategoryDistribution[]>("/api/analytics/category-distribution"),
          fetchJson<TagFrequency[]>("/api/analytics/tag-cloud"),
          fetchJson<ActivityEvent[]>("/api/analytics/activity-feed"),
          fetchJson<TrendsData>("/api/analytics/trends"),
          fetchJson<LocationEntry[]>("/api/analytics/locations"),
        ])
      return { summary, topVoted, categoryDistribution, tagCloud, activityFeed, trends, locations }
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useExport() {
  return useMutation({
    mutationFn: async ({
      type,
      format,
    }: {
      type: string
      format: "csv" | "pdf"
    }): Promise<Blob> => {
      const res = await fetch(`/api/analytics/export?type=${type}&format=${format}`)
      if (!res.ok) throw new Error("Export failed")
      return res.blob()
    },
  })
}
