import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('lucide-react', () => ({
  FileText: () => <span>FileTextIcon</span>,
  ThumbsUp: () => <span>ThumbsUpIcon</span>,
  MessageSquare: () => <span>MessageSquareIcon</span>,
  MapPin: () => <span>MapPinIcon</span>,
  Users: () => <span>UsersIcon</span>,
  CheckCircle2: () => <span>CheckCircle2Icon</span>,
  Trophy: () => <span>TrophyIcon</span>,
  ArrowUp: () => <span>ArrowUpIcon</span>,
  Hash: () => <span>HashIcon</span>,
  Activity: () => <span>ActivityIcon</span>,
  DollarSign: () => <span>DollarSignIcon</span>,
  TrendingUp: () => <span>TrendingUpIcon</span>,
  TrendingDown: () => <span>TrendingDownIcon</span>,
  PieChartIcon: () => <span>PieChartIcon</span>,
  Globe: () => <span>GlobeIcon</span>,
  Loader2: () => <span>LoaderIcon</span>,
  AlertCircle: () => <span>AlertIcon</span>,
  RefreshCw: () => <span>RefreshIcon</span>,
  Download: () => <span>DownloadIcon</span>,
  FileSpreadsheet: () => <span>SpreadsheetIcon</span>,
  BarChart3: () => <span>BarChartIcon</span>,
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: ({ children }: any) => <div>{children}</div>,
  Cell: () => <div>Cell</div>,
  Tooltip: () => <div>Tooltip</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div>Line</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>Grid</div>,
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: any) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div>Separator</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}))

describe('StatCard', () => {
  it('renders title and value', async () => {
    const { StatCard } = await import('@/components/dashboard/stat-card')
    const { FileText } = await import('lucide-react')
    render(<StatCard title="Total Entries" value={42} icon={FileText} />)
    expect(screen.getByText('Total Entries')).toBeTruthy()
    expect(screen.getByText('42')).toBeTruthy()
  })

  it('renders description when provided', async () => {
    const { StatCard } = await import('@/components/dashboard/stat-card')
    const { FileText } = await import('lucide-react')
    render(<StatCard title="Entries" value={10} description="5 published" icon={FileText} />)
    expect(screen.getByText('5 published')).toBeTruthy()
  })

  it('renders positive trend indicator', async () => {
    const { StatCard } = await import('@/components/dashboard/stat-card')
    const { FileText } = await import('lucide-react')
    render(<StatCard title="Growth" value={100} icon={FileText} trend={{ value: 12, positive: true }} />)
    expect(screen.getByText('+12%')).toBeTruthy()
  })

  it('renders negative trend indicator', async () => {
    const { StatCard } = await import('@/components/dashboard/stat-card')
    const { FileText } = await import('lucide-react')
    render(<StatCard title="Growth" value={100} icon={FileText} trend={{ value: 5, positive: false }} />)
    expect(screen.getByText('5%')).toBeTruthy()
  })
})

describe('BudgetSummary', () => {
  it('renders formatted budget amount', async () => {
    const { BudgetSummary } = await import('@/components/dashboard/budget-summary')
    render(<BudgetSummary data={{ totalBudget: 500000, budgetCurrency: 'USD' }} />)
    expect(screen.getByText(/\$500,000/)).toBeTruthy()
  })

  it('renders trend when provided', async () => {
    const { BudgetSummary } = await import('@/components/dashboard/budget-summary')
    render(<BudgetSummary data={{ totalBudget: 1000, budgetCurrency: 'USD' }} trend={15} />)
    expect(screen.getByText('+15% from last month')).toBeTruthy()
  })

  it('renders negative trend', async () => {
    const { BudgetSummary } = await import('@/components/dashboard/budget-summary')
    render(<BudgetSummary data={{ totalBudget: 1000, budgetCurrency: 'USD' }} trend={-8} />)
    expect(screen.getByText('-8% from last month')).toBeTruthy()
  })
})

describe('TopVotedTable', () => {
  it('renders empty state when no data', async () => {
    const { TopVotedTable } = await import('@/components/dashboard/top-voted-table')
    render(<TopVotedTable data={[]} />)
    expect(screen.getByText('No entries with votes yet.')).toBeTruthy()
  })

  it('renders ranked entries', async () => {
    const { TopVotedTable } = await import('@/components/dashboard/top-voted-table')
    const data = [
      { id: '1', title: 'Entry A', slug: 'entry-a', voteCount: 10, authorName: 'Alice' },
      { id: '2', title: 'Entry B', slug: 'entry-b', voteCount: 5, authorName: null },
    ]
    render(<TopVotedTable data={data} />)
    expect(screen.getByText('Entry A')).toBeTruthy()
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Entry B')).toBeTruthy()
    expect(screen.getAllByText(/10|5/).length).toBeGreaterThanOrEqual(2)
  })

  it('shows rank numbers', async () => {
    const { TopVotedTable } = await import('@/components/dashboard/top-voted-table')
    const data = [
      { id: '1', title: 'Top', slug: 'top', voteCount: 10, authorName: null },
    ]
    render(<TopVotedTable data={data} />)
    expect(screen.getByText('1')).toBeTruthy()
  })
})

describe('CategoryPieChart', () => {
  it('renders empty state when no data', async () => {
    const { CategoryPieChart } = await import('@/components/dashboard/category-pie-chart')
    render(<CategoryPieChart data={[]} />)
    expect(screen.getByText('No categories found.')).toBeTruthy()
  })

  it('renders categories with counts', async () => {
    const { CategoryPieChart } = await import('@/components/dashboard/category-pie-chart')
    const data = [
      { name: 'Tech', slug: 'tech', count: 15, fill: '#8884d8' },
      { name: 'Finance', slug: 'finance', count: 8 },
    ]
    render(<CategoryPieChart data={data} />)
    expect(screen.getByText(/Tech\s*\(15\)/)).toBeTruthy()
    expect(screen.getByText(/Finance\s*\(8\)/)).toBeTruthy()
  })
})

describe('TagCloud', () => {
  it('renders empty state when no data', async () => {
    const { TagCloud } = await import('@/components/dashboard/tag-cloud')
    render(<TagCloud data={[]} />)
    expect(screen.getByText('No tags found.')).toBeTruthy()
  })

  it('renders tag names', async () => {
    const { TagCloud } = await import('@/components/dashboard/tag-cloud')
    const data = [
      { name: 'react', slug: 'react', count: 20, weight: 1 },
      { name: 'typescript', slug: 'typescript', count: 10, weight: 0.5 },
    ]
    render(<TagCloud data={data} />)
    expect(screen.getByText('react')).toBeTruthy()
    expect(screen.getByText('typescript')).toBeTruthy()
  })
})

describe('ActivityFeed', () => {
  it('renders empty state when no data', async () => {
    const { ActivityFeed } = await import('@/components/dashboard/activity-feed')
    render(<ActivityFeed data={[]} />)
    expect(screen.getByText('No recent activity.')).toBeTruthy()
  })

  it('renders activity events', async () => {
    const { ActivityFeed } = await import('@/components/dashboard/activity-feed')
    const data: import('@/types/analytics').ActivityEvent[] = [
      { id: '1', type: 'create', description: 'Created new entry', entityId: 'f1', entityTitle: 'Entry', userName: 'Alice', timestamp: new Date().toISOString() },
      { id: '2', type: 'vote', description: 'Upvoted entry', entityId: 'f2', entityTitle: 'Entry 2', userName: null, timestamp: new Date().toISOString() },
    ]
    render(<ActivityFeed data={data} />)
    expect(screen.getByText('Created new entry')).toBeTruthy()
    expect(screen.getByText('Upvoted entry')).toBeTruthy()
    expect(screen.getByText(/Alice/)).toBeTruthy()
    expect(screen.getByText('Recent Activity')).toBeTruthy()
  })
})

describe('FeasibilityMap', () => {
  it('renders empty state when no locations', async () => {
    const { FeasibilityMap } = await import('@/components/dashboard/feasibility-map')
    render(<FeasibilityMap locations={[]} totalLocations={0} />)
    expect(screen.getByText('No locations registered yet.')).toBeTruthy()
  })

  it('renders location count', async () => {
    const { FeasibilityMap } = await import('@/components/dashboard/feasibility-map')
    const locations = [
      { id: '1', name: 'Site A', address: '123 Main St', latitude: 40.7128, longitude: -74.006, fileTitle: 'Project X', fileSlug: 'project-x' },
    ]
    render(<FeasibilityMap locations={locations} totalLocations={1} />)
    expect(screen.getByText(/1 location registered/)).toBeTruthy()
    expect(screen.getByText('Site A')).toBeTruthy()
    expect(screen.getByText('Project X')).toBeTruthy()
  })
})
