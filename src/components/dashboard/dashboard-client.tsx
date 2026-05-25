"use client"

import { useEffect, useState } from "react"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { TopVotedTable } from "@/components/dashboard/top-voted-table"
import { BudgetSummary } from "@/components/dashboard/budget-summary"
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart"
import { TagCloud } from "@/components/dashboard/tag-cloud"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { FeasibilityMap } from "@/components/dashboard/feasibility-map"
import { TrendCharts } from "@/components/dashboard/trend-charts"
import { ExportButton } from "@/components/dashboard/export-button"
import type {
  DashboardSummary,
  TopVotedEntry,
  CategoryDistribution,
  TagFrequency,
  ActivityEvent,
  TrendsData,
} from "@/types/analytics"
import {
  FileText,
  ThumbsUp,
  MessageSquare,
  MapPin,
  Users,
  CheckCircle2,
} from "lucide-react"

interface LocationEntry {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  fileTitle: string
  fileSlug: string
}

interface DashboardDataState {
  summary: DashboardSummary | null
  topVoted: TopVotedEntry[]
  categoryDistribution: CategoryDistribution[]
  tagCloud: TagFrequency[]
  activityFeed: ActivityEvent[]
  trends: TrendsData | null
  locations: LocationEntry[]
}

type FetchStatus = "loading" | "error" | "success"

export function DashboardClient() {
  const [data, setData] = useState<DashboardDataState>({
    summary: null,
    topVoted: [],
    categoryDistribution: [],
    tagCloud: [],
    activityFeed: [],
    trends: null,
    locations: [],
  })
  const [status, setStatus] = useState<FetchStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus("loading")
      setError(null)

      try {
        const [
          summaryRes,
          topVotedRes,
          categoryRes,
          tagRes,
          activityRes,
          trendsRes,
          locationsRes,
        ] = await Promise.all([
          fetch("/api/analytics/summary"),
          fetch("/api/analytics/top-voted"),
          fetch("/api/analytics/category-distribution"),
          fetch("/api/analytics/tag-cloud"),
          fetch("/api/analytics/activity-feed"),
          fetch("/api/analytics/trends"),
          fetch("/api/analytics/locations"),
        ])

        if (cancelled) return
        if (!summaryRes.ok) throw new Error("Failed to load summary")
        if (!topVotedRes.ok) throw new Error("Failed to load top voted")
        if (!categoryRes.ok) throw new Error("Failed to load categories")
        if (!tagRes.ok) throw new Error("Failed to load tags")
        if (!activityRes.ok) throw new Error("Failed to load activity")
        if (!trendsRes.ok) throw new Error("Failed to load trends")

        const [summaryJson, topVotedJson, categoryJson, tagJson, activityJson, trendsJson, locationsJson] =
          await Promise.all([
            summaryRes.json(),
            topVotedRes.json(),
            categoryRes.json(),
            tagRes.json(),
            activityRes.json(),
            trendsRes.json(),
            locationsRes.json(),
          ])

        if (cancelled) return
        setData({
          summary: summaryJson.data,
          topVoted: topVotedJson.data ?? [],
          categoryDistribution: categoryJson.data ?? [],
          tagCloud: tagJson.data ?? [],
          activityFeed: activityJson.data ?? [],
          trends: trendsJson.data,
          locations: locationsJson.data ?? [],
        })
        setStatus("success")
      } catch (err) {
        if (cancelled) return
        console.error("Dashboard data fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
        setStatus("error")
      }
    }

    load()
    return () => { cancelled = true }
  }, [refreshKey])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-medium">Failed to load dashboard</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" onClick={refresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const { summary, topVoted, categoryDistribution, tagCloud, activityFeed, trends, locations } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investor Dashboard</h1>
          <p className="text-muted-foreground">
            Analytics and insights across all entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <ExportButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Entries"
          value={summary?.totalEntries ?? 0}
          description={`${summary?.publishedEntries ?? 0} published`}
          icon={FileText}
        />
        <StatCard
          title="Total Votes"
          value={summary?.totalVotes ?? 0}
          icon={ThumbsUp}
        />
        <StatCard
          title="Comments"
          value={summary?.totalComments ?? 0}
          icon={MessageSquare}
        />
        <StatCard
          title="Investment Interests"
          value={summary?.totalInvestmentInterests ?? 0}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <BudgetSummary
          data={{
            totalBudget: summary?.totalBudget ?? 0,
            budgetCurrency: summary?.budgetCurrency ?? "USD",
          }}
        />
        <StatCard
          title="Locations"
          value={summary?.totalLocations ?? 0}
          description="Registered feasibility locations"
          icon={MapPin}
        />
        <StatCard
          title="Published Rate"
          value={
            summary && summary.totalEntries > 0
              ? `${Math.round((summary.publishedEntries / summary.totalEntries) * 100)}%`
              : "0%"
          }
          description={`${summary?.publishedEntries ?? 0} of ${summary?.totalEntries ?? 0} entries`}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopVotedTable data={topVoted} />
        <CategoryPieChart data={categoryDistribution} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendCharts data={trends ?? { entriesOverTime: [], votesOverTime: [] }} />
        <div className="space-y-4">
          <TagCloud data={tagCloud} />
          <ActivityFeed data={activityFeed} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FeasibilityMap
          locations={locations}
          totalLocations={summary?.totalLocations ?? 0}
        />
      </div>
    </div>
  )
}
