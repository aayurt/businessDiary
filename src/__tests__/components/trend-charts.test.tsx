import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('lucide-react', () => ({
  TrendingUp: () => <span>TrendingUpIcon</span>,
  BarChart3: () => <span>BarChartIcon</span>,
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div>Line</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  Tooltip: () => <div>Tooltip</div>,
  CartesianGrid: () => <div>Grid</div>,
}))

function makeTrendPoint(date: string, count: number) {
  return { date, count }
}

describe('TrendCharts', () => {
  it('renders empty state when no data', async () => {
    const { TrendCharts } = await import('@/components/dashboard/trend-charts')
    render(<TrendCharts data={{ entriesOverTime: [], votesOverTime: [] }} />)
    expect(screen.getByText('No entry data yet.')).toBeTruthy()
    expect(screen.getByText('No vote data yet.')).toBeTruthy()
  })

  it('renders chart section titles', async () => {
    const { TrendCharts } = await import('@/components/dashboard/trend-charts')
    render(<TrendCharts data={{ entriesOverTime: [], votesOverTime: [] }} />)
    expect(screen.getByText('Entries Over Time')).toBeTruthy()
    expect(screen.getByText('Votes Over Time')).toBeTruthy()
  })

  it('renders data points for entries', async () => {
    const { TrendCharts } = await import('@/components/dashboard/trend-charts')
    const entries = Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - 29 + i)
      return makeTrendPoint(d.toISOString().split('T')[0], i + 1)
    })
    render(
      <TrendCharts
        data={{
          entriesOverTime: entries,
          votesOverTime: entries.map((e) => ({ ...e, count: 0 })),
        }}
      />
    )
    expect(screen.queryByText('No entry data yet.')).toBeNull()
  })

  it('shows empty state when entries exist but votes do not', async () => {
    const { TrendCharts } = await import('@/components/dashboard/trend-charts')
    const entries = [makeTrendPoint('2025-01-01', 5)]
    render(<TrendCharts data={{ entriesOverTime: entries, votesOverTime: [] }} />)
    expect(screen.queryByText('No entry data yet.')).toBeNull()
    expect(screen.getByText('No vote data yet.')).toBeTruthy()
  })

  it('shows empty state when votes exist but entries do not', async () => {
    const { TrendCharts } = await import('@/components/dashboard/trend-charts')
    const votes = [makeTrendPoint('2025-01-01', 3)]
    render(<TrendCharts data={{ entriesOverTime: [], votesOverTime: votes }} />)
    expect(screen.getByText('No entry data yet.')).toBeTruthy()
    expect(screen.queryByText('No vote data yet.')).toBeNull()
  })
})
