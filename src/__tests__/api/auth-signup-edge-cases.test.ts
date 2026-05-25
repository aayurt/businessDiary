import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
  hash: vi.fn().mockResolvedValue('hashed-password'),
}))

const dbModule = await import('@/lib/db')
const db = dbModule.db

async function postSignup(body: Record<string, unknown>) {
  const mod = await import('@/app/api/auth/signup/route')
  const request = new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return mod.POST(request)
}

describe('POST /api/auth/signup — edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects non-JSON Content-Type', async () => {
    const mod = await import('@/app/api/auth/signup/route')
    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'name=test&email=test@test.com&password=password123',
    })
    const response = await mod.POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('rejects extremely long passwords', async () => {
    const response = await postSignup({
      name: 'User',
      email: 'user@test.com',
      password: 'a'.repeat(513),
    })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('rejects email with invalid format', async () => {
    const response = await postSignup({
      name: 'User',
      email: 'not-an-email',
      password: 'password123',
    })
    const body = await response.json()

    expect(response.status).toBe(400)
  })

  it('rejects empty name with valid email and password', async () => {
    const response = await postSignup({
      name: '',
      email: 'test@test.com',
      password: 'password123',
    })
    const body = await response.json()

    expect(response.status).toBe(400)
  })

  it('trims whitespace from email', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    vi.mocked(db.user.create).mockResolvedValue({ id: 'user-1' } as any)

    const response = await postSignup({
      name: 'User',
      email: '  test@test.com  ',
      password: 'password123',
    })
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: expect.not.stringContaining(' '),
        }),
      })
    )
  })

  it('handles unique constraint violation race condition', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
    vi.mocked(db.user.create).mockRejectedValueOnce(
      Object.assign(new Error('Unique violation'), { code: 'P2002' })
    )

    const response = await postSignup({
      name: 'User',
      email: 'test@test.com',
      password: 'password123',
    })
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toBeDefined()
  })

  it('handles missing request body', async () => {
    const mod = await import('@/app/api/auth/signup/route')
    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await mod.POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
  })
})
