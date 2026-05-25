import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    mdFile: {
      findUnique: vi.fn(),
    },
    vote: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

const authModule = await import('@/lib/auth')
const dbModule = await import('@/lib/db')
const db = dbModule.db

async function importHandler() {
  return await import('@/app/api/files/[fileId]/vote/route')
}

describe('POST /api/files/[fileId]/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSession = { user: { id: 'user-1', email: 'alice@test.com' }, expires: '' }

  it('creates a new vote', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession as any)
    vi.mocked(db.mdFile.findUnique).mockResolvedValue({ id: 'file-1' } as any)
    vi.mocked(db.vote.findUnique).mockResolvedValue(null)
    vi.mocked(db.vote.create).mockResolvedValue({ id: 'vote-1', value: 1 } as any)

    const mod = await importHandler()
    const request = new Request('http://localhost/api/files/file-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 1 }),
    }) as any
    const response = await mod.POST(request, { params: Promise.resolve({ fileId: 'file-1' }) })
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.action).toBe('created')
    expect(db.vote.create).toHaveBeenCalledWith({
      data: { value: 1, fileId: 'file-1', userId: 'user-1' },
    })
  })

  it('rejects unauthenticated requests', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as any)

    const mod = await importHandler()
    const request = new Request('http://localhost/api/files/file-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 1 }),
    }) as any
    const response = await mod.POST(request, { params: Promise.resolve({ fileId: 'file-1' }) })
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('rejects vote on non-existent file', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession as any)
    vi.mocked(db.mdFile.findUnique).mockResolvedValue(null)

    const mod = await importHandler()
    const request = new Request('http://localhost/api/files/bad-id/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 1 }),
    }) as any
    const response = await mod.POST(request, { params: Promise.resolve({ fileId: 'bad-id' }) })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('rejects invalid vote value', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession as any)
    vi.mocked(db.mdFile.findUnique).mockResolvedValue({ id: 'file-1' } as any)

    const mod = await importHandler()
    const request = new Request('http://localhost/api/files/file-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 999 }),
    }) as any
    const response = await mod.POST(request, { params: Promise.resolve({ fileId: 'file-1' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('INVALID_VALUE')
  })

  it('removes vote when same value clicked again', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession as any)
    vi.mocked(db.mdFile.findUnique).mockResolvedValue({ id: 'file-1' } as any)
    vi.mocked(db.vote.findUnique).mockResolvedValue({ id: 'vote-1', value: 1 } as any)
    vi.mocked(db.vote.delete).mockResolvedValue({ id: 'vote-1' } as any)

    const mod = await importHandler()
    const request = new Request('http://localhost/api/files/file-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 1 }),
    }) as any
    const response = await mod.POST(request, { params: Promise.resolve({ fileId: 'file-1' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.action).toBe('removed')
    expect(db.vote.delete).toHaveBeenCalled()
  })

  it('changes vote when different value clicked', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession as any)
    vi.mocked(db.mdFile.findUnique).mockResolvedValue({ id: 'file-1' } as any)
    vi.mocked(db.vote.findUnique).mockResolvedValue({ id: 'vote-1', value: 1 } as any)
    vi.mocked(db.vote.update).mockResolvedValue({ id: 'vote-1', value: -1 } as any)

    const mod = await importHandler()
    const request = new Request('http://localhost/api/files/file-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: -1 }),
    })
    const response = await mod.POST(request, { params: Promise.resolve({ fileId: 'file-1' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.action).toBe('changed')
    expect(db.vote.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { value: -1 } })
    )
  })

  it('returns 500 on db error', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession)
    vi.mocked(db.mdFile.findUnique).mockRejectedValue(new Error('DB error'))

    const mod = await importHandler()
    const request = new Request('http://localhost/api/files/file-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 1 }),
    }) as any
    const response = await mod.POST(request, { params: Promise.resolve({ fileId: 'file-1' }) })
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})
