"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import type { DashboardSummary } from "@/types/analytics"

interface BudgetSummaryProps {
  data: Pick<DashboardSummary, "totalBudget" | "budgetCurrency">
  trend?: number
}

export function BudgetSummary({ data, trend }: BudgetSummaryProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: data.budgetCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(data.totalBudget)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatted}</div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span
              className={`text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {trend >= 0 ? "+" : ""}
              {trend}% from last month
            </span>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Total budget across all entries
        </p>
      </CardContent>
    </Card>
  )
}
