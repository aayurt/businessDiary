import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    mdFile: { findUnique: vi.fn() },
    vote: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

const authModule = await import('@/lib/auth')

async function importHandler() {
  return await import('@/app/api/files/[fileId]/vote/route')
}

async function postVote(fileId: string, value: number) {
  const mod = await importHandler()
  const request = new Request(`http://localhost/api/files/${fileId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  })
  return mod.POST(request, { params: Promise.resolve({ fileId }) })
}

describe('POST /api/files/[fileId]/vote — edge cases', () => {
  const mockSession = { user: { id: 'user-1', email: 'alice@test.com' }, expires: '' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authModule.auth).mockResolvedValue(mockSession as any)
  })

  it('handles concurrent duplicate requests gracefully', async () => {
    const dbModule = await import('@/lib/db')
    vi.mocked(dbModule.db.mdFile.findUnique).mockResolvedValue({ id: 'file-1' } as any)
    vi.mocked(dbModule.db.vote.findUnique).mockResolvedValue(null)
    vi.mocked(dbModule.db.vote.create).mockRejectedValueOnce(
      Object.assign(new Error('Unique constraint'), { code: 'P2002' })
    )

    const response = await postVote('file-1', 1)
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error.code).toBe('CONFLICT')
  })

  it('handles non-JSON request body', async () => {
    const mod = await importHandler()
    const request = new Request('http://localhost/api/files/file-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const response = await mod.POST(request, { params: Promise.resolve({ fileId: 'file-1' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('rejects missing value in body', async () => {
    const mod = await importHandler()
    const request = new Request('http://localhost/api/files/file-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const response = await mod.POST(request, { params: Promise.resolve({ fileId: 'file-1' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('INVALID_VALUE')
  })

  it('handles malformed fileId', async () => {
    const dbModule = await import('@/lib/db')
    vi.mocked(dbModule.db.mdFile.findUnique).mockResolvedValue(null)

    const response = await postVote('../../etc/passwd', 1)
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('returns consistent response shape on success', async () => {
    const dbModule = await import('@/lib/db')
    vi.mocked(dbModule.db.mdFile.findUnique).mockResolvedValue({ id: 'file-1' } as any)
    vi.mocked(dbModule.db.vote.findUnique).mockResolvedValue(null)
    vi.mocked(dbModule.db.vote.create).mockResolvedValue({ id: 'v1', value: 1, fileId: 'file-1', userId: 'user-1' } as any)

    const response = await postVote('file-1', 1)
    const body = await response.json()

    expect(body).toHaveProperty('success', true)
    expect(body).toHaveProperty('data')
    expect(body.data).toHaveProperty('action')
    expect(body.data).toHaveProperty('score')
    expect(body).not.toHaveProperty('error')
  })

  it('includes error code and message in error responses', async () => {
    const dbModule = await import('@/lib/db')
    vi.mocked(dbModule.db.mdFile.findUnique).mockRejectedValue(new Error('DB timeout'))

    const response = await postVote('file-1', 1)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toHaveProperty('code', 'INTERNAL_ERROR')
    expect(body.error).toHaveProperty('message')
  })
})
