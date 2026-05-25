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
  default: { hash: () => 'hashed-password' },
  hash: () => 'hashed-password',
}))

const dbModule = await import('@/lib/db')
const db = dbModule.db

async function importHandler() {
  return await import('@/app/api/auth/signup/route')
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new user with valid data', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    vi.mocked(db.user.create).mockResolvedValue({ id: 'new-user-id' } as any)

    const mod = await importHandler()
    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'alice@test.com', password: 'password123' }),
    })
    const response = await mod.POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.success).toBe(true)
    expect(db.user.create).toHaveBeenCalledWith({
      data: { name: 'Alice', email: 'alice@test.com', hashedPassword: 'hashed-password' },
    })
  })

  it('rejects missing email', async () => {
    const mod = await importHandler()
    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'password123' }),
    })
    const response = await mod.POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Email and password are required')
  })

  it('rejects missing password', async () => {
    const mod = await importHandler()
    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@test.com' }),
    })
    const response = await mod.POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Email and password are required')
  })

  it('rejects short password', async () => {
    const mod = await importHandler()
    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'alice@test.com', password: 'short' }),
    })
    const response = await mod.POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Password must be at least 8 characters')
  })

  it('rejects duplicate email', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'existing' } as any)

    const mod = await importHandler()
    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'existing@test.com', password: 'password123' }),
    })
    const response = await mod.POST(request)
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toBe('Email already in use')
  })

  it('returns 500 on db error', async () => {
    vi.mocked(db.user.findUnique).mockRejectedValue(new Error('DB down'))

    const mod = await importHandler()
    const request = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'alice@test.com', password: 'password123' }),
    })
    const response = await mod.POST(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe('Something went wrong')
  })
})
