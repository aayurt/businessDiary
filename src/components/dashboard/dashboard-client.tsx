"use client"

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
import { SyncButton } from "@/components/ui/sync-button"
import { useDashboardData } from "@/lib/hooks/use-analytics"
import {
  FileText,
  ThumbsUp,
  MessageSquare,
  MapPin,
  Users,
  CheckCircle2,
} from "lucide-react"

export function DashboardClient() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useDashboardData()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-medium">Failed to load dashboard</p>
            <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Failed to load dashboard data"}</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const { summary, topVoted, categoryDistribution, tagCloud, activityFeed, trends, locations } = data!

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
          <SyncButton />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
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
