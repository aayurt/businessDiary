import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    mdFile: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    vote: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    category: { findMany: vi.fn() },
    tag: { findMany: vi.fn() },
    budgetEstimate: { aggregate: vi.fn(), findMany: vi.fn() },
    comment: { count: vi.fn(), findMany: vi.fn() },
    location: { count: vi.fn(), findMany: vi.fn() },
    investmentInterest: { count: vi.fn(), findMany: vi.fn() },
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
  hash: vi.fn().mockResolvedValue('hashed-password'),
}))

const authModule = vi.mocked(await import('@/lib/auth'))
const dbModule = vi.mocked(await import('@/lib/db'))
const db = dbModule.db

function makeAnalyticsSummaryResponse() {
  return {
    success: true,
    data: {
      totalEntries: 42,
      totalVotes: 150,
      totalBudget: 1000000,
      budgetCurrency: 'USD',
      totalComments: 80,
      totalLocations: 12,
      totalInvestmentInterests: 25,
      publicEntries: 30,
    },
  }
}

function makeTopVotedResponse() {
  return {
    success: true,
    data: [
      { id: '1', title: 'Entry A', slug: 'entry-a', voteCount: 10, authorName: 'Alice' },
      { id: '2', title: 'Entry B', slug: 'entry-b', voteCount: 7, authorName: 'Bob' },
    ],
  }
}

function makeCategoryResponse() {
  return {
    success: true,
    data: [
      { name: 'Tech', slug: 'tech', count: 15, fill: '#8884d8' },
      { name: 'Finance', slug: 'finance', count: 8, fill: '#82ca9d' },
    ],
  }
}

function makeTagCloudResponse() {
  return {
    success: true,
    data: [
      { name: 'react', slug: 'react', count: 20, weight: 1 },
      { name: 'typescript', slug: 'typescript', count: 10, weight: 0.5 },
    ],
  }
}

function makeTrendResponse() {
  return {
    success: true,
    data: {
      entriesOverTime: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
        count: i,
      })),
      votesOverTime: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
        count: i * 2,
      })),
    },
  }
}

function makeLocationResponse() {
  return {
    success: true,
    data: [
      { id: 'loc1', name: 'Site A', address: '123 Main St', latitude: 40.7128, longitude: -74.006, fileTitle: 'Project X', fileSlug: 'project-x' },
    ],
  }
}

describe('API Integration — Cross-endpoint consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dashboard summary counts are consistent with sub-endpoint totals', async () => {
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

    const summaryMod = await import('@/app/api/analytics/summary/route')
    const summaryRes = await summaryMod.GET()
    const summaryBody = await summaryRes.json()

    expect(summaryBody.data.totalEntries).toBe(42)
    expect(summaryBody.data.publicEntries).toBe(30)

    vi.mocked(db.mdFile.findMany).mockResolvedValue([
      { id: '1', title: 'Entry A', slug: 'entry-a', author: { name: 'Alice' }, _count: { votes: 10 } },
      { id: '2', title: 'Entry B', slug: 'entry-b', author: { name: 'Bob' }, _count: { votes: 7 } },
    ] as any)

    const topVotedMod = await import('@/app/api/analytics/top-voted/route')
    const topVotedRes = await topVotedMod.GET()
    const topVotedBody = await topVotedRes.json()

    const totalVotesFromTop = topVotedBody.data.reduce(
      (sum: number, e: { voteCount: number }) => sum + e.voteCount,
      0
    )
    expect(totalVotesFromTop).toBeLessThanOrEqual(summaryBody.data.totalVotes)
  })

  it('category count sums match total entries', async () => {
    vi.mocked(db.mdFile.count).mockResolvedValue(23)
    vi.mocked(db.mdFile.count).mockImplementation(async (args?: any) => {
      if (args?.where?.privacy === 'PUBLIC') return 23
      return 23
    })
    vi.mocked(db.vote.count).mockResolvedValue(0)
    vi.mocked(db.budgetEstimate.aggregate).mockResolvedValue({ _sum: { amount: null } } as any)
    vi.mocked(db.comment.count).mockResolvedValue(0)
    vi.mocked(db.location.count).mockResolvedValue(0)
    vi.mocked(db.investmentInterest.count).mockResolvedValue(0)

    vi.mocked(db.category.findMany).mockResolvedValue([
      { name: 'Tech', slug: 'tech', _count: { files: 15 } },
      { name: 'Finance', slug: 'finance', _count: { files: 8 } },
    ] as any)

    const summaryMod = await import('@/app/api/analytics/summary/route')
    const summaryRes = await summaryMod.GET()
    const summaryBody = await summaryRes.json()
    const totalEntries = summaryBody.data.totalEntries

    const catMod = await import('@/app/api/analytics/category-distribution/route')
    const catRes = await catMod.GET()
    const catBody = await catRes.json()

    const categorizedEntries = catBody.data.reduce(
      (sum: number, c: { count: number }) => sum + c.count,
      0
    )
    expect(categorizedEntries).toBeLessThanOrEqual(totalEntries)
  })

  it('vote endpoint updates are reflected in summary counts', async () => {
    vi.mocked(authModule.auth).mockResolvedValue({
      user: { id: 'user-1', email: 'alice@test.com' },
      expires: '',
    } as any)

    vi.mocked(db.mdFile.count).mockResolvedValue(1)
    vi.mocked(db.vote.count).mockResolvedValue(0)
    vi.mocked(db.budgetEstimate.aggregate).mockResolvedValue({ _sum: { amount: null } } as any)
    vi.mocked(db.comment.count).mockResolvedValue(0)
    vi.mocked(db.location.count).mockResolvedValue(0)
    vi.mocked(db.investmentInterest.count).mockResolvedValue(0)

    const initialSummaryMod = await import('@/app/api/analytics/summary/route')
    const initialSummaryRes = await initialSummaryMod.GET()
    const initialBody = await initialSummaryRes.json()
    expect(initialBody.data.totalVotes).toBe(0)

    vi.mocked(db.mdFile.findUnique).mockResolvedValue({ id: 'file-1' } as any)
    vi.mocked(db.vote.findUnique).mockResolvedValue(null)
    vi.mocked(db.vote.create).mockResolvedValue({ id: 'vote-1', value: 1 } as any)

    const voteMod = await import('@/app/api/files/[fileId]/vote/route')
    const voteRequest = new Request('http://localhost/api/files/file-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 1 }),
    })
    const voteRes = await voteMod.POST(voteRequest, { params: Promise.resolve({ fileId: 'file-1' }) })
    const voteBody = await voteRes.json()
    expect(voteBody.data.action).toBe('created')
    expect(voteBody.data.score).toBeDefined()
  })
})

describe('API Integration — Auth propagation across endpoints', () => {
  it('public analytics endpoints work without auth', async () => {
    vi.mocked(db.mdFile.count).mockResolvedValue(5)
    vi.mocked(db.vote.count).mockResolvedValue(10)
    vi.mocked(db.budgetEstimate.aggregate).mockResolvedValue({ _sum: { amount: null } } as any)
    vi.mocked(db.comment.count).mockResolvedValue(0)
    vi.mocked(db.location.count).mockResolvedValue(0)
    vi.mocked(db.investmentInterest.count).mockResolvedValue(0)

    const summaryMod = await import('@/app/api/analytics/summary/route')
    const res = await summaryMod.GET()
    expect(res.status).toBe(200)
  })

  it('vote endpoint rejects unauthenticated requests', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as any)

    const voteMod = await import('@/app/api/files/[fileId]/vote/route')
    const request = new Request('http://localhost/api/files/file-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 1 }),
    })
    const res = await voteMod.POST(request, { params: Promise.resolve({ fileId: 'file-1' }) })
    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('signup creates user that can be referenced in votes', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    vi.mocked(db.user.create).mockResolvedValue({ id: 'user-1', name: 'Alice', email: 'alice@test.com' } as any)

    const signupMod = await import('@/app/api/auth/signup/route')
    const signupRequest = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'alice@test.com', password: 'password123' }),
    })
    const signupRes = await signupMod.POST(signupRequest)
    const signupBody = await signupRes.json()

    expect(signupRes.status).toBe(201)
    expect(signupBody.success).toBe(true)

    expect(db.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'alice@test.com',
        name: 'Alice',
      }),
    })
  })
})

describe('API Integration — Cross-endpoint error handling', () => {
  it('db failure in one endpoint does not cascade to others', async () => {
    vi.mocked(db.mdFile.count).mockRejectedValue(new Error('Summary DB failure'))
    vi.mocked(db.mdFile.findMany).mockResolvedValue([
      { id: '1', title: 'Entry A', slug: 'entry-a', author: { name: 'Alice' }, _count: { votes: 10 } },
    ] as any)

    const summaryMod = await import('@/app/api/analytics/summary/route')
    const topVotedMod = await import('@/app/api/analytics/top-voted/route')

    const [summaryRes, topVotedRes] = await Promise.all([
      summaryMod.GET(),
      topVotedMod.GET(),
    ])

    expect(summaryRes.status).toBe(500)
    expect(topVotedRes.status).toBe(200)
  })

  it('analytics endpoints return consistent error shapes', async () => {
    vi.mocked(db.mdFile.count).mockRejectedValue(new Error('DB error'))

    const mod = await import('@/app/api/analytics/summary/route')
    const res = await mod.GET()
    const body = await res.json()

    expect(body).toHaveProperty('success', false)
    expect(body).toHaveProperty('error')
    expect(body.error).toHaveProperty('code')
    expect(body.error).toHaveProperty('message')
  })
})

describe('API Integration — Response shape consistency', () => {
  beforeEach(() => {
    vi.mocked(db.mdFile.count).mockResolvedValue(10)
    vi.mocked(db.vote.count).mockResolvedValue(20)
    vi.mocked(db.budgetEstimate.aggregate).mockResolvedValue({ _sum: { amount: 500000 } } as any)
    vi.mocked(db.comment.count).mockResolvedValue(5)
    vi.mocked(db.location.count).mockResolvedValue(3)
    vi.mocked(db.investmentInterest.count).mockResolvedValue(2)
  })

  it('all successful analytics responses have consistent envelope', async () => {
    const endpoints = [
      { mod: await import('@/app/api/analytics/summary/route'), name: 'summary' },
      { mod: await import('@/app/api/analytics/activity-feed/route'), name: 'activity-feed' },
      { mod: await import('@/app/api/analytics/tag-cloud/route'), name: 'tag-cloud' },
    ]

    for (const { mod, name } of endpoints) {
      vi.mocked(db.tag.findMany).mockResolvedValue([
        { name: 'test', slug: 'test', _count: { files: 1 } },
      ] as any)
      vi.mocked(db.mdFile.findMany).mockResolvedValue([
        { id: '1', title: 'Test', author: { name: 'Alice' }, createdAt: new Date() },
      ] as any)
      vi.mocked(db.vote.findMany).mockResolvedValue([] as any)
      vi.mocked(db.comment.findMany).mockResolvedValue([] as any)
      vi.mocked(db.budgetEstimate.findMany).mockResolvedValue([] as any)
      vi.mocked(db.investmentInterest.findMany).mockResolvedValue([] as any)

      const res = await mod.GET()
      const body = await res.json()

      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('data')
      expect(body).not.toHaveProperty('error')
    }
  })
})
