import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    mdFile: { count: vi.fn(), findMany: vi.fn() },
    vote: { count: vi.fn(), findMany: vi.fn() },
    category: { findMany: vi.fn() },
    tag: { findMany: vi.fn() },
    budgetEstimate: { aggregate: vi.fn(), findMany: vi.fn() },
    comment: { count: vi.fn(), findMany: vi.fn() },
    location: { count: vi.fn(), findMany: vi.fn() },
    investmentInterest: { count: vi.fn(), findMany: vi.fn() },
  },
}))

const dbModule = await import('@/lib/db')
const db = dbModule.db

async function importHandler(path: string) {
  return await import(path)
}

describe('GET /api/analytics/summary — edge cases', () => {
  beforeEach(() => vi.clearAllMocks())

  it('handles zero counts across the board', async () => {
    vi.mocked(db.mdFile.count).mockResolvedValue(0)
    vi.mocked(db.vote.count).mockResolvedValue(0)
    vi.mocked(db.budgetEstimate.aggregate).mockResolvedValue({ _sum: { amount: null } } as any)
    vi.mocked(db.comment.count).mockResolvedValue(0)
    vi.mocked(db.location.count).mockResolvedValue(0)
    vi.mocked(db.investmentInterest.count).mockResolvedValue(0)
    vi.mocked(db.mdFile.count).mockImplementation(async (args?: any) => {
      if (args?.where?.published === true) return 0
      return 0
    })

    const mod = await importHandler('@/app/api/analytics/summary/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.totalEntries).toBe(0)
    expect(body.data.totalBudget).toBe(0)
    expect(body.data.budgetCurrency).toBe('USD')
  })

  it('handles null budget aggregate gracefully', async () => {
    vi.mocked(db.mdFile.count).mockResolvedValue(5)
    vi.mocked(db.vote.count).mockResolvedValue(10)
    vi.mocked(db.budgetEstimate.aggregate).mockResolvedValue({ _sum: { amount: null } } as any)
    vi.mocked(db.comment.count).mockResolvedValue(3)
    vi.mocked(db.location.count).mockResolvedValue(1)
    vi.mocked(db.investmentInterest.count).mockResolvedValue(2)
    vi.mocked(db.mdFile.count).mockImplementation(async (args?: any) => {
      if (args?.where?.published === true) return 3
      return 5
    })

    const mod = await importHandler('@/app/api/analytics/summary/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.data.totalBudget).toBe(0)
    expect(body.data.publishedEntries).toBe(3)
    expect(body.data.totalEntries).toBe(5)
  })
})

describe('GET /api/analytics/tag-cloud — edge cases', () => {
  beforeEach(() => vi.clearAllMocks())

  it('handles single tag correctly', async () => {
    vi.mocked(db.tag.findMany).mockResolvedValue([
      { name: 'solo', slug: 'solo', _count: { files: 1 } },
    ] as any)

    const mod = await importHandler('@/app/api/analytics/tag-cloud/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.data).toHaveLength(1)
    expect(body.data[0].weight).toBe(1)
  })

  it('normalizes weights correctly across varying counts', async () => {
    vi.mocked(db.tag.findMany).mockResolvedValue([
      { name: 'top', slug: 'top', _count: { files: 100 } },
      { name: 'mid', slug: 'mid', _count: { files: 50 } },
      { name: 'low', slug: 'low', _count: { files: 1 } },
    ] as any)

    const mod = await importHandler('@/app/api/analytics/tag-cloud/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.data[0].weight).toBe(1)
    expect(body.data[1].weight).toBeGreaterThan(0.3)
    expect(body.data[1].weight).toBeLessThan(1)
    expect(body.data[2].weight).toBeGreaterThan(0)
    expect(body.data[2].weight).toBeLessThan(body.data[1].weight)
  })
})

describe('GET /api/analytics/export — edge cases', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 for missing type param', async () => {
    const mod = await importHandler('@/app/api/analytics/export/route')
    const request = new Request('http://localhost/api/analytics/export?format=csv')
    const response = await mod.GET(request)
    const body = await response.json()

    expect(response.status).toBe(400)
  })

  it('returns 400 for missing format param', async () => {
    const mod = await importHandler('@/app/api/analytics/export/route')
    const request = new Request('http://localhost/api/analytics/export?type=entries')
    const response = await mod.GET(request)
    const body = await response.json()

    expect(response.status).toBe(400)
  })

  it('handles empty export dataset', async () => {
    vi.mocked(db.mdFile.findMany).mockResolvedValue([])

    const mod = await importHandler('@/app/api/analytics/export/route')
    const request = new Request('http://localhost/api/analytics/export?type=entries&format=csv')
    const response = await mod.GET(request)

    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toContain('ID,Title,Slug')
  })

  it('returns JSON for PDF format (client-side PDF generation)', async () => {
    vi.mocked(db.mdFile.findMany).mockResolvedValue([
      {
        id: '1', title: 'Test', slug: 'test', published: true,
        author: { name: 'Alice', email: 'alice@test.com' },
        _count: { votes: 3, comments: 1 },
        createdAt: new Date(), updatedAt: new Date(),
      },
    ] as any)

    const mod = await importHandler('@/app/api/analytics/export/route')
    const request = new Request('http://localhost/api/analytics/export?type=entries&format=pdf')
    const response = await mod.GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('json')
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toContain('Test')
  })
})

describe('GET /api/analytics/activity-feed — edge cases', () => {
  beforeEach(() => vi.clearAllMocks())

  it('handles empty feed gracefully', async () => {
    vi.mocked(db.mdFile.findMany).mockResolvedValue([])
    vi.mocked(db.vote.findMany).mockResolvedValue([])
    vi.mocked(db.comment.findMany).mockResolvedValue([])
    vi.mocked(db.budgetEstimate.findMany).mockResolvedValue([])
    vi.mocked(db.investmentInterest.findMany).mockResolvedValue([])

    const mod = await importHandler('@/app/api/analytics/activity-feed/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual([])
  })

  it('merges all event types correctly', async () => {
    const now = new Date()
    vi.mocked(db.mdFile.findMany).mockResolvedValue([
      { id: 'f1', title: 'Entry', author: { name: 'Alice' }, createdAt: now },
    ] as any)
    vi.mocked(db.vote.findMany).mockResolvedValue([
      { id: 'v1', value: 1, file: { id: 'f1', title: 'Entry' }, user: { name: 'Bob' }, createdAt: now },
    ] as any)
    vi.mocked(db.comment.findMany).mockResolvedValue([
      { id: 'c1', content: 'Great!', file: { id: 'f1', title: 'Entry' }, author: { name: 'Charlie' }, createdAt: now },
    ] as any)
    vi.mocked(db.budgetEstimate.findMany).mockResolvedValue([
      { id: 'b1', amount: 50000, file: { id: 'f1', title: 'Entry' }, createdBy: { name: 'Diana' }, createdAt: now },
    ] as any)
    vi.mocked(db.investmentInterest.findMany).mockResolvedValue([
      { id: 'i1', amount: 100000, message: 'Interested', file: { id: 'f1', title: 'Entry' }, user: { name: 'Eve' }, createdAt: now },
    ] as any)

    const mod = await importHandler('@/app/api/analytics/activity-feed/route')
    const response = await mod.GET()
    const body = await response.json()

    const types = new Set(body.data.map((e: any) => e.type))
    expect(types.has('create')).toBe(true)
    expect(types.has('vote')).toBe(true)
    expect(types.has('comment')).toBe(true)
    expect(types.has('budget')).toBe(true)
    expect(types.has('investment')).toBe(true)
  })
})

describe('GET /api/analytics/trends — edge cases', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 30 days of zero-filled data when no entries exist', async () => {
    vi.mocked(db.mdFile.findMany).mockResolvedValue([])
    vi.mocked(db.vote.findMany).mockResolvedValue([])

    const mod = await importHandler('@/app/api/analytics/trends/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.data.entriesOverTime).toHaveLength(30)
    expect(body.data.votesOverTime).toHaveLength(30)
    body.data.entriesOverTime.forEach((point: any) => {
      expect(point.count).toBe(0)
    })
  })

  it('accumulates running totals correctly', async () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 86400000)
    vi.mocked(db.mdFile.findMany).mockResolvedValue([
      { createdAt: yesterday },
      { createdAt: today },
    ] as any)
    vi.mocked(db.vote.findMany).mockResolvedValue([
      { createdAt: yesterday },
      { createdAt: yesterday },
    ] as any)

    const mod = await importHandler('@/app/api/analytics/trends/route')
    const response = await mod.GET()
    const body = await response.json()

    const totalEntries = body.data.entriesOverTime[body.data.entriesOverTime.length - 1].count
    const totalVotes = body.data.votesOverTime[body.data.votesOverTime.length - 1].count
    expect(totalEntries).toBe(2)
    expect(totalVotes).toBe(2)
  })
})
