import { describe, it, expect } from 'vitest'
import { chaosEdgeScanner } from '../../../scripts/audit/scanners/chaos-edge-scanner'
import { dbScanner } from '../../../scripts/audit/scanners/db-scanner'
import { apiScanner } from '../../../scripts/audit/scanners/api-scanner'
import { authScanner } from '../../../scripts/audit/scanners/auth-scanner'
import { componentScanner } from '../../../scripts/audit/scanners/component-scanner'
import { securityScanner } from '../../../scripts/audit/scanners/security-scanner'
import { tsScanner } from '../../../scripts/audit/scanners/typescript-scanner'
import { configScanner } from '../../../scripts/audit/scanners/config-scanner'
import { buildContext } from '../../../scripts/audit/scanner-utils'
import { ScanContext } from '../../../scripts/audit/types'
import * as path from 'path'

const ROOT = process.cwd()

function makeContext(files: Map<string, string>, models?: string[], envVars?: Record<string, string>): ScanContext {
  return {
    rootDir: ROOT,
    files: [...files.keys()],
    schemaPath: path.join(ROOT, 'prisma', 'schema.prisma'),
    prismaModels: models || [],
    envVars: envVars || {},
    sourceContents: files,
  }
}

/* ================================================================== */
/*  CHAOS EDGE-CASE SCANNER TESTS                                     */
/* ================================================================== */

describe('chaosEdgeScanner', () => {
  describe('race conditions', () => {
    it('detects unawaited Promise.all', () => {
      const files = new Map<string, string>([
        ['src/api/test.ts', `
export async function handler() {
  Promise.all([fetch('/a'), fetch('/b')])
  return { ok: true }
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('Promise.all') && !f.title.includes('awaited'))).toBe(true)
    })

    it('detects sequential awaits in loop', () => {
      const files = new Map<string, string>([
        ['src/api/loop.ts', `
async function process(items: number[]) {
  for (const item of items) {
    await db.update(item)
    await db.log(item)
  }
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.category === 'edge-case' && f.title.includes('Sequential'))).toBe(true)
    })

    it('detects unhandled async call', () => {
      const files = new Map<string, string>([
        ['src/api/handler.ts', `
async function notifyUser() {
  await fetch('/notify')
}
notifyUser()
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('Unhandled async'))).toBe(true)
    })

    it('does not flag awaited async calls', () => {
      const files = new Map<string, string>([
        ['src/api/handler.ts', `
async function notifyUser() {
  await fetch('/notify')
}
async function run() {
  await notifyUser()
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.filter(f => f.title.includes('Unhandled async')).length).toBe(0)
    })
  })

  describe('input validation gaps', () => {
    it('detects req.json() without validation', () => {
      const files = new Map<string, string>([
        ['src/api/route.ts', `
export async function POST(req: Request) {
  const body = await req.json()
  await db.user.create({ data: body })
  return Response.json({ ok: true })
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('Request body parsed without validation'))).toBe(true)
    })

    it('detects req.json() not in try/catch', () => {
      const files = new Map<string, string>([
        ['src/api/route.ts', `
export async function POST(req: Request) {
  const body = await req.json()
  return Response.json(body)
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('not in try/catch'))).toBe(true)
    })

    it('does not flag zod-validated code', () => {
      const files = new Map<string, string>([
        ['src/api/route.ts', `
import { z } from 'zod'
const schema = z.object({ name: z.string() })
export async function POST(req: Request) {
  const body = await req.json()
  const data = schema.parse(body)
  return Response.json(data)
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.filter(f => f.title.includes('Request body parsed without validation')).length).toBe(0)
    })
  })

  describe('mass assignment', () => {
    it('detects spread into db.create', () => {
      const files = new Map<string, string>([
        ['src/api/users.ts', `
export async function POST(req: Request) {
  const body = await req.json()
  await db.user.create({ data: { ...body } })
  return Response.json({ ok: true })
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('Mass assignment'))).toBe(true)
    })
  })

  describe('path traversal', () => {
    it('detects user input in fs operations without path.join', () => {
      const files = new Map<string, string>([
        ['src/api/files.ts', `
import * as fs from 'fs'
export async function GET(req: Request) {
  const content = fs.readFileSync('/uploads/' + req.url.split('/').pop())
  return Response.json({ content })
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('Path traversal'))).toBe(true)
    })
  })

  describe('IDOR', () => {
    it('detects direct object reference without ownership check', () => {
      const files = new Map<string, string>([
        ['src/api/mdfiles/[id]/route.ts', `
export async function GET(req: Request, { params }: any) {
  const file = await db.mdFile.findUnique({ where: { id: params.id } })
  return Response.json(file)
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('IDOR'))).toBe(true)
    })

    it('does not flag when ownership check present', () => {
      const files = new Map<string, string>([
        ['src/api/mdfiles/[id]/route.ts', `
export async function GET(req: Request, { params }: any) {
  const session = await auth()
  const file = await db.mdFile.findUnique({
    where: { id: params.id, userId: session.user.id }
  })
  return Response.json(file)
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.filter(f => f.title.includes('IDOR')).length).toBe(0)
    })
  })

  describe('unbounded pagination', () => {
    it('detects findMany without take', () => {
      const files = new Map<string, string>([
        ['src/api/mdfiles/route.ts', `
export async function GET() {
  const files = await db.mdFile.findMany()
  return Response.json(files)
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('Unbounded database query'))).toBe(true)
    })
  })

  describe('error disclosure', () => {
    it('detects raw error.message in response', () => {
      const files = new Map<string, string>([
        ['src/api/route.ts', `
export async function GET() {
  try {
    await db.query()
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('Error information disclosure'))).toBe(true)
    })
  })

  describe('CSRF', () => {
    it('detects mutation API without CSRF protection', () => {
      const files = new Map<string, string>([
        ['src/api/posts/route.ts', `
export async function POST(req: Request) {
  const body = await req.json()
  await db.post.create({ data: body })
  return Response.json({ ok: true })
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('CSRF'))).toBe(true)
    })
  })

  describe('timing attacks', () => {
    it('detects string comparison on sensitive values', () => {
      const files = new Map<string, string>([
        ['src/api/auth.ts', `
export async function verifyToken(token: string, stored: string) {
  return token === stored
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('Timing attack'))).toBe(true)
    })
  })

  describe('denial of service', () => {
    it('detects infinite while(true) without break', () => {
      const files = new Map<string, string>([
        ['src/lib/process.ts', `
export function process() {
  while (true) {
    console.log('running')
  }
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('Infinite while(true)'))).toBe(true)
    })
  })

  describe('deprecated APIs', () => {
    it('detects deprecated substr usage', () => {
      const files = new Map<string, string>([
        ['src/lib/string.ts', `
export function truncate(s: string, len: number) {
  return s.substr(0, len)
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('Deprecated API'))).toBe(true)
    })
  })

  describe('unvalidated redirects', () => {
    it('detects unvalidated redirect with user input', () => {
      const files = new Map<string, string>([
        ['src/lib/auth.ts', `
export function loginRedirect(callbackUrl: string) {
  redirect(callbackUrl)
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('Unvalidated redirect'))).toBe(true)
    })
  })

  describe('mutable state leak', () => {
    it('detects mutable module-level state in server component', () => {
      const files = new Map<string, string>([
        ['src/app/page.tsx', `
let counter = {}

export default function Page() {
  return <div>hello</div>
}
`],
      ])
      const findings = chaosEdgeScanner.scan(makeContext(files))
      expect(findings.some(f => f.title.includes('Mutable module-level state'))).toBe(true)
    })
  })
})

/* ================================================================== */
/*  DB SCANNER TESTS                                                  */
/* ================================================================== */

describe('dbScanner', () => {
  it('detects non-existent model call', () => {
    const files = new Map<string, string>([
      ['src/api/test.ts', `
await db.nonexistentModel.findMany()
`],
    ])
    const findings = dbScanner.scan(makeContext(files, ['User', 'MdFile']))
    expect(findings.some(f => f.severity === 'critical')).toBe(true)
  })

  it('detects db.post -> db.mdFile mismatch', () => {
    const files = new Map<string, string>([
      ['src/api/test.ts', `
await db.post.findMany()
`],
    ])
    const findings = dbScanner.scan(makeContext(files, ['User', 'MdFile']))
    expect(findings.some(f => f.title.includes('db.post'))).toBe(true)
  })

  it('does not flag valid model calls', () => {
    const files = new Map<string, string>([
      ['src/api/test.ts', `
await db.user.findMany()
await db.mdFile.findUnique({ where: { id: '1' } })
`],
    ])
    const findings = dbScanner.scan(makeContext(files, ['User', 'MdFile']))
    expect(findings.filter(f => f.severity === 'critical').length).toBe(0)
  })
})

/* ================================================================== */
/*  API SCANNER TESTS                                                 */
/* ================================================================== */

describe('apiScanner', () => {
  it('detects API route without try/catch', () => {
    const files = new Map<string, string>([
      ['src/api/test/route.ts', `
export async function GET() {
  const data = await db.query()
  return Response.json(data)
}
`],
    ])
    const findings = apiScanner.scan(makeContext(files))
    expect(findings.some(f => f.title.includes('no try/catch'))).toBe(true)
  })

  it('does not flag handler with try/catch', () => {
    const files = new Map<string, string>([
      ['src/api/test/route.ts', `
export async function GET() {
  try {
    const data = await db.query()
    return Response.json(data)
  } catch (e) {
    return Response.json({ error: 'failed' }, { status: 500 })
  }
}
`],
    ])
    const findings = apiScanner.scan(makeContext(files))
    expect(findings.filter(f => f.title.includes('no try/catch')).length).toBe(0)
  })

  it('detects missing input validation', () => {
    const files = new Map<string, string>([
      ['src/api/test/route.ts', `
export async function POST(req: Request) {
  const body = await req.json()
  await db.user.create({ data: body })
}
`],
    ])
    const findings = apiScanner.scan(makeContext(files))
    expect(findings.some(f => f.title.includes('Missing input validation'))).toBe(true)
  })
})

/* ================================================================== */
/*  AUTH SCANNER TESTS                                                */
/* ================================================================== */

describe('authScanner', () => {
  it('detects missing rate limiting on credentials', () => {
    const files = new Map<string, string>([
      ['src/lib/auth.ts', `
export const { handlers, signIn } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        return { id: '1', email: 'test@test.com' }
      },
    }),
  ],
})
`],
    ])
    const envVars = {}
    const findings = authScanner.scan(makeContext(files, [], envVars))
    expect(findings.some(f => f.title.includes('rate limiting'))).toBe(true)
  })

  it('detects empty OAuth credentials', () => {
    const envVars = { AUTH_GITHUB_ID: '', AUTH_GITHUB_SECRET: '' }
    const findings = authScanner.scan(makeContext(new Map(), [], envVars))
    expect(findings.some(f => f.title.includes('Empty OAuth'))).toBe(true)
  })
})

/* ================================================================== */
/*  COMPONENT SCANNER TESTS                                           */
/* ================================================================== */

describe('componentScanner', () => {
  it('detects client hooks in server component', () => {
    const files = new Map<string, string>([
      ['src/app/page.tsx', `
export default function Page() {
  const [count, setCount] = useState(0)
  return <div>{count}</div>
}
`],
    ])
    const findings = componentScanner.scan(makeContext(files))
    expect(findings.some(f => f.category === 'component' && f.severity === 'critical')).toBe(true)
  })

  it('detects missing key in map', () => {
    const files = new Map<string, string>([
      ['src/app/page.tsx', `
export default function List({ items }: { items: string[] }) {
  return <ul>{items.map(i => <li>{i}</li>)}</ul>
}
`],
    ])
    const findings = componentScanner.scan(makeContext(files))
    expect(findings.some(f => f.title.includes('Missing key'))).toBe(true)
  })

  it('does not flag client component with hooks', () => {
    const files = new Map<string, string>([
      ['src/app/form.tsx', `
"use client"
export default function Form() {
  const [name, setName] = useState('')
  return <input value={name} onChange={e => setName(e.target.value)} />
}
`],
    ])
    const findings = componentScanner.scan(makeContext(files))
    const critical = findings.filter(f => f.severity === 'critical')
    expect(critical.length).toBe(0)
  })
})

/* ================================================================== */
/*  SECURITY SCANNER TESTS                                            */
/* ================================================================== */

describe('securityScanner', () => {
  it('detects dangerouslySetInnerHTML', () => {
    const files = new Map<string, string>([
      ['src/app/page.tsx', `
export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: userContent }} />
}
`],
    ])
    const findings = securityScanner.scan(makeContext(files))
    expect(findings.some(f => f.title.includes('dangerouslySetInnerHTML'))).toBe(true)
  })

  it('detects eval() usage', () => {
    const files = new Map<string, string>([
      ['src/lib/calc.ts', `
export function calculate(expr: string) {
  return eval(expr)
}
`],
    ])
    const findings = securityScanner.scan(makeContext(files))
    expect(findings.some(f => f.title.includes('eval()'))).toBe(true)
  })

  it('detects permissive CORS header', () => {
    const files = new Map<string, string>([
      ['src/middleware.ts', `
const headers = {
  'Access-Control-Allow-Origin': '*',
}
`],
    ])
    const findings = securityScanner.scan(makeContext(files))
    expect(findings.some(f => f.title.includes('CORS'))).toBe(true)
  })
})

/* ================================================================== */
/*  TYPESCRIPT SCANNER TESTS                                          */
/* ================================================================== */

describe('tsScanner', () => {
  it('detects as any type assertions', () => {
    const files = new Map<string, string>([
      ['src/lib/util.ts', `
export function process(data: unknown) {
  return (data as any).value
}
`],
    ])
    const findings = tsScanner.scan(makeContext(files))
    expect(findings.some(f => f.title.includes('as any'))).toBe(true)
  })

  it('detects non-null assertions', () => {
    const files = new Map<string, string>([
      ['src/lib/util.ts', `
export function getName(user: { name?: string }) {
  return user.name!
}
`],
    ])
    const findings = tsScanner.scan(makeContext(files))
    expect(findings.some(f => f.title.includes('Non-null assertion'))).toBe(true)
  })

  it('detects async function without try/catch', () => {
    const files = new Map<string, string>([
      ['src/lib/service.ts', `
export async function fetchData() {
  const response = await fetch('/api/data')
  return response.json()
}
`],
    ])
    const findings = tsScanner.scan(makeContext(files))
    expect(findings.some(f => f.title.includes('no try/catch') || f.title.includes('error handling'))).toBe(true)
  })
})

/* ================================================================== */
/*  CONFIG SCANNER TESTS                                              */
/* ================================================================== */

describe('configScanner', () => {
  it('produces findings for current workspace', () => {
    const context = buildContext(ROOT, path.join(ROOT, 'prisma', 'schema.prisma'))
    const findings = configScanner.scan(context)
    expect(findings.length).toBeGreaterThan(0)
  })
})

/* ================================================================== */
/*  INTEGRATION TEST: Build context works                              */
/* ================================================================== */

describe('buildContext integration', () => {
  it('discovers TS files in the workspace', () => {
    const ctx = buildContext(ROOT, path.join(ROOT, 'prisma', 'schema.prisma'))
    expect(ctx.files.length).toBeGreaterThan(0)
    expect(ctx.files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))).toBe(true)
  })

  it('extracts Prisma models', () => {
    const ctx = buildContext(ROOT, path.join(ROOT, 'prisma', 'schema.prisma'))
    expect(ctx.prismaModels.length).toBeGreaterThan(0)
    expect(ctx.prismaModels).toContain('User')
    expect(ctx.prismaModels).toContain('MdFile')
  })

  it('reads environment variables', () => {
    const ctx = buildContext(ROOT, path.join(ROOT, 'prisma', 'schema.prisma'))
    expect(Object.keys(ctx.envVars).length).toBeGreaterThan(0)
    expect(ctx.envVars.DATABASE_URL).toBeDefined()
  })
})

/* ================================================================== */
/*  FULL AUDIT RUN TEST                                               */
/* ================================================================== */

describe('full audit integration', () => {
  const scanners = [dbScanner, apiScanner, authScanner, componentScanner, securityScanner, tsScanner, configScanner, chaosEdgeScanner]

  it('all scanners run without throwing', () => {
    const context = buildContext(ROOT, path.join(ROOT, 'prisma', 'schema.prisma'))
    for (const scanner of scanners) {
      expect(() => scanner.scan(context)).not.toThrow()
    }
  })

  it('all scanners produce legitimate findings', () => {
    const context = buildContext(ROOT, path.join(ROOT, 'prisma', 'schema.prisma'))
    let totalFindings = 0
    for (const scanner of scanners) {
      const findings = scanner.scan(context)
      totalFindings += findings.length
      for (const f of findings) {
        expect(f.file).toBeTruthy()
        expect(f.line).toBeGreaterThanOrEqual(0)
        expect(f.severity).toMatch(/^(critical|high|medium|low|info)$/)
        expect(f.title).toBeTruthy()
        expect(f.message).toBeTruthy()
      }
    }
    expect(totalFindings).toBeGreaterThan(0)
  })

  it('chaos edge scanner finds issues in real codebase', () => {
    const context = buildContext(ROOT, path.join(ROOT, 'prisma', 'schema.prisma'))
    const findings = chaosEdgeScanner.scan(context)
    expect(findings.length).toBeGreaterThan(0)
    const bySeverity = new Map<string, number>()
    for (const f of findings) {
      bySeverity.set(f.severity, (bySeverity.get(f.severity) || 0) + 1)
    }
    expect(bySeverity.get('critical') || 0).toBeGreaterThanOrEqual(0)
    expect(bySeverity.get('high') || 0).toBeGreaterThanOrEqual(0)
  })
})
