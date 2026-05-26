import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    mdFile: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    vote: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
    },
    budgetEstimate: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    comment: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    location: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    investmentInterest: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

const dbModule = await import('@/lib/db')
const db = dbModule.db

async function importHandler(path: string) {
  return await import(path)
}

describe('GET /api/analytics/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns dashboard summary with all fields', async () => {
    vi.mocked(db.mdFile.count).mockResolvedValue(42)
    vi.mocked(db.vote.count).mockResolvedValue(150)
    vi.mocked(db.budgetEstimate.aggregate).mockResolvedValue({ _sum: { amount: 1000000 } } as any)
    vi.mocked(db.comment.count).mockResolvedValue(80)
    vi.mocked(db.location.count).mockResolvedValue(12)
    vi.mocked(db.investmentInterest.count).mockResolvedValue(25)

    vi.mocked(db.mdFile.count).mockImplementation(async (args?: any) => {
      if (args?.where?.privacy === 'PUBLIC') return 30
      return 42
    })

    const mod = await importHandler('@/app/api/analytics/summary/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toMatchObject({
      totalEntries: 42,
      totalVotes: 150,
      totalBudget: 1000000,
      budgetCurrency: 'USD',
      totalComments: 80,
      totalLocations: 12,
      totalInvestmentInterests: 25,
    })
  })

  it('returns 500 on db error', async () => {
    vi.mocked(db.mdFile.count).mockRejectedValue(new Error('DB down'))

    const mod = await importHandler('@/app/api/analytics/summary/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('GET /api/analytics/top-voted', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns top 5 voted entries', async () => {
    const mockEntries = [
      { id: '1', title: 'Top Entry', slug: 'top-entry', author: { name: 'Alice' }, _count: { votes: 10 } },
      { id: '2', title: 'Runner Up', slug: 'runner-up', author: { name: 'Bob' }, _count: { votes: 7 } },
    ]
    vi.mocked(db.mdFile.findMany).mockResolvedValue(mockEntries as any)

    const mod = await importHandler('@/app/api/analytics/top-voted/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(2)
    expect(body.data[0].voteCount).toBe(10)
    expect(body.data[0].authorName).toBe('Alice')
  })

  it('handles empty results', async () => {
    vi.mocked(db.mdFile.findMany).mockResolvedValue([])

    const mod = await importHandler('@/app/api/analytics/top-voted/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it('returns 500 on db error', async () => {
    vi.mocked(db.mdFile.findMany).mockRejectedValue(new Error('Query failed'))

    const mod = await importHandler('@/app/api/analytics/top-voted/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('GET /api/analytics/category-distribution', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns category distribution sorted by count', async () => {
    const mockCats = [
      { name: 'Tech', slug: 'tech', _count: { files: 15 } },
      { name: 'Finance', slug: 'finance', _count: { files: 8 } },
    ]
    vi.mocked(db.category.findMany).mockResolvedValue(mockCats as any)

    const mod = await importHandler('@/app/api/analytics/category-distribution/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data[0].name).toBe('Tech')
    expect(body.data[0].count).toBe(15)
    expect(body.data[0].fill).toBeDefined()
  })

  it('handles empty categories', async () => {
    vi.mocked(db.category.findMany).mockResolvedValue([])

    const mod = await importHandler('@/app/api/analytics/category-distribution/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.data).toEqual([])
  })

  it('wraps colors for more than 10 categories', async () => {
    const manyCats = Array.from({ length: 12 }, (_, i) => ({
      name: `Cat ${i}`,
      slug: `cat-${i}`,
      _count: { files: i + 1 },
    }))
    vi.mocked(db.category.findMany).mockResolvedValue(manyCats as any)

    const mod = await importHandler('@/app/api/analytics/category-distribution/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.data).toHaveLength(12)
    expect(body.data[10].fill).toBe(body.data[0].fill)
  })
})

describe('GET /api/analytics/tag-cloud', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns weighted tag frequencies', async () => {
    const mockTags = [
      { name: 'popular', slug: 'popular', _count: { files: 20 } },
      { name: 'rare', slug: 'rare', _count: { files: 5 } },
    ]
    vi.mocked(db.tag.findMany).mockResolvedValue(mockTags as any)

    const mod = await importHandler('@/app/api/analytics/tag-cloud/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data[0].name).toBe('popular')
    expect(body.data[0].weight).toBe(1)
    expect(body.data[1].weight).toBe(0.3)
  })

  it('caps at 50 tags', async () => {
    const manyTags = Array.from({ length: 60 }, (_, i) => ({
      name: `tag${i}`,
      slug: `tag-${i}`,
      _count: { files: 1 },
    }))
    vi.mocked(db.tag.findMany).mockImplementation(async (args?: any) => {
      return manyTags.slice(0, args?.take ?? 50) as any
    })

    const mod = await importHandler('@/app/api/analytics/tag-cloud/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.data.length).toBeLessThanOrEqual(50)
  })

  it('handles empty tags', async () => {
    vi.mocked(db.tag.findMany).mockResolvedValue([])

    const mod = await importHandler('@/app/api/analytics/tag-cloud/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.data).toEqual([])
  })
})

describe('GET /api/analytics/activity-feed', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns merged activity feed sorted by recency', async () => {
    const now = new Date()
    vi.mocked(db.mdFile.findMany).mockResolvedValue([
      { id: 'f1', title: 'New Entry', author: { name: 'Alice' }, createdAt: now },
    ] as any)
    vi.mocked(db.vote.findMany).mockResolvedValue([
      { id: 'v1', value: 1, file: { id: 'f1', title: 'Entry' }, user: { name: 'Bob' }, createdAt: now },
    ] as any)
    vi.mocked(db.comment.findMany).mockResolvedValue([] as any)
    vi.mocked(db.budgetEstimate.findMany).mockResolvedValue([] as any)
    vi.mocked(db.investmentInterest.findMany).mockResolvedValue([] as any)

    const mod = await importHandler('@/app/api/analytics/activity-feed/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(2)
    expect(body.data[0].type).toBeDefined()
    expect(body.data[0].userName).toBeDefined()
  })

  it('caps feed at 20 events', async () => {
    const manyItems = Array.from({ length: 25 }, (_, i) => ({
      id: `f${i}`,
      title: `Entry ${i}`,
      author: { name: 'User' },
      createdAt: new Date(),
    }))
    vi.mocked(db.mdFile.findMany).mockResolvedValue(manyItems as any)
    vi.mocked(db.vote.findMany).mockResolvedValue([] as any)
    vi.mocked(db.comment.findMany).mockResolvedValue([] as any)
    vi.mocked(db.budgetEstimate.findMany).mockResolvedValue([] as any)
    vi.mocked(db.investmentInterest.findMany).mockResolvedValue([] as any)

    const mod = await importHandler('@/app/api/analytics/activity-feed/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.data.length).toBeLessThanOrEqual(20)
  })

  it('returns 500 on db error', async () => {
    vi.mocked(db.mdFile.findMany).mockRejectedValue(new Error('DB error'))

    const mod = await importHandler('@/app/api/analytics/activity-feed/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('GET /api/analytics/trends', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns entries and votes over time', async () => {
    vi.mocked(db.mdFile.findMany).mockResolvedValue([
      { createdAt: new Date() },
    ] as any)
    vi.mocked(db.vote.findMany).mockResolvedValue([
      { createdAt: new Date() },
    ] as any)

    const mod = await importHandler('@/app/api/analytics/trends/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data.entriesOverTime.length).toBe(30)
    expect(body.data.votesOverTime.length).toBe(30)
    expect(body.data.entriesOverTime[0].date).toBeDefined()
    expect(body.data.entriesOverTime[0].count).toBeGreaterThanOrEqual(0)
  })

  it('returns 500 on db error', async () => {
    vi.mocked(db.mdFile.findMany).mockRejectedValue(new Error('Trend query failed'))

    const mod = await importHandler('@/app/api/analytics/trends/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('GET /api/analytics/locations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns mapped location entries', async () => {
    const mockLocations = [
      {
        id: 'loc1',
        name: 'Site A',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.006,
        file: { title: 'Project X', slug: 'project-x' },
      },
    ]
    vi.mocked(db.location.findMany).mockResolvedValue(mockLocations as any)

    const mod = await importHandler('@/app/api/analytics/locations/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data[0].name).toBe('Site A')
    expect(body.data[0].fileTitle).toBe('Project X')
    expect(body.data[0].latitude).toBe(40.7128)
  })

  it('handles empty locations', async () => {
    vi.mocked(db.location.findMany).mockResolvedValue([])

    const mod = await importHandler('@/app/api/analytics/locations/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(body.data).toEqual([])
  })

  it('returns 500 on db error', async () => {
    vi.mocked(db.location.findMany).mockRejectedValue(new Error('Location query failed'))

    const mod = await importHandler('@/app/api/analytics/locations/route')
    const response = await mod.GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('GET /api/analytics/export', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exports entries as CSV', async () => {
    vi.mocked(db.mdFile.findMany).mockResolvedValue([
      {
        id: '1',
        title: 'Test Entry',
        slug: 'test-entry',
        privacy: 'PUBLIC',
        author: { name: 'Alice', email: 'alice@test.com' },
        _count: { votes: 5, comments: 2 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      },
    ] as any)

    const mod = await importHandler('@/app/api/analytics/export/route')
    const request = new Request('http://localhost/api/analytics/export?type=entries&format=csv')
    const response = await mod.GET(request)

    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toContain('ID,Title,Slug')
    expect(text).toContain('Test Entry')
    expect(text).toContain('Alice')
  })

  it('exports budgets as CSV', async () => {
    vi.mocked(db.budgetEstimate.findMany).mockResolvedValue([
      {
        id: 'b1',
        amount: 50000,
        currency: 'USD',
        description: 'Infra',
        file: { title: 'Project', slug: 'project' },
        createdBy: { name: 'Bob' },
        createdAt: new Date('2024-01-01'),
      },
    ] as any)

    const mod = await importHandler('@/app/api/analytics/export/route')
    const request = new Request('http://localhost/api/analytics/export?type=budgets&format=csv')
    const response = await mod.GET(request)

    const text = await response.text()
    expect(text).toContain('ID,File Title,File Slug')
    expect(text).toContain('50000')
  })

  it('exports votes as CSV', async () => {
    vi.mocked(db.vote.findMany).mockResolvedValue([
      {
        id: 'v1',
        value: 1,
        file: { title: 'Entry', slug: 'entry' },
        user: { name: 'Charlie', email: 'c@test.com' },
        createdAt: new Date('2024-01-01'),
      },
    ] as any)

    const mod = await importHandler('@/app/api/analytics/export/route')
    const request = new Request('http://localhost/api/analytics/export?type=votes&format=csv')
    const response = await mod.GET(request)

    const text = await response.text()
    expect(text).toContain('ID,Value,File Title')
    expect(text).toContain('Charlie')
  })

  it('exports investments as CSV', async () => {
    vi.mocked(db.investmentInterest.findMany).mockResolvedValue([
      {
        id: 'inv1',
        amount: 100000,
        message: 'Interested',
        file: { title: 'Project', slug: 'project' },
        user: { name: 'Diana', email: 'd@test.com' },
        createdAt: new Date('2024-01-01'),
      },
    ] as any)

    const mod = await importHandler('@/app/api/analytics/export/route')
    const request = new Request('http://localhost/api/analytics/export?type=investments&format=csv')
    const response = await mod.GET(request)

    const text = await response.text()
    expect(text).toContain('ID,File Title,File Slug')
    expect(text).toContain('Diana')
  })

  it('returns 400 for invalid export type', async () => {
    const mod = await importHandler('@/app/api/analytics/export/route')
    const request = new Request('http://localhost/api/analytics/export?type=invalid&format=csv')
    const response = await mod.GET(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('INVALID_TYPE')
  })

  it('returns 500 on db error', async () => {
    vi.mocked(db.mdFile.findMany).mockRejectedValue(new Error('Export failed'))

    const mod = await importHandler('@/app/api/analytics/export/route')
    const request = new Request('http://localhost/api/analytics/export?type=entries&format=csv')
    const response = await mod.GET(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})
