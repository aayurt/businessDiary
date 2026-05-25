import { Scanner, Finding } from '../types'
import { findPattern, makeFinding, relativePath } from '../scanner-utils'

const MAX_FILE_SIZE = 50_000

export const authScanner: Scanner = {
  name: 'Auth Configuration Scanner',

  scan(context): Finding[] {
    const findings: Finding[] = []
    const { rootDir, envVars, sourceContents } = context

    findings.push(
      ...scanEnvFile(rootDir, envVars),
      ...scanAuthConfig(sourceContents, rootDir),
      ...scanSignupRoute(sourceContents, rootDir),
      ...scanAuthPages(sourceContents, rootDir),
    )

    return findings
  },
}

function scanEnvFile(
  _rootDir: string,
  envVars: Record<string, string>,
): Finding[] {
  const findings: Finding[] = []

  for (const [key, value] of Object.entries(envVars)) {
    if (key === 'AUTH_SECRET' && value) {
      findings.push(
        makeFinding(
          '.env',
          1,
          'high',
          'security',
          'Sensitive: AUTH_SECRET',
          'AUTH_SECRET is exposed in .env (not .env.local)',
          'Move AUTH_SECRET to .env.local and ensure .env.local is in .gitignore',
          'AUTH_SECRET=***',
          1,
        ),
      )
    }

    if (key === 'DATABASE_URL' && value) {
      const dbMatch = /postgresql:\/\/([^:]+):([^@]+)@/.exec(value)
      if (dbMatch) {
        findings.push(
          makeFinding(
            '.env',
            1,
            'high',
            'security',
            'Database credentials in .env',
            `DATABASE_URL has credentials (user: ${dbMatch[1]})`,
            'Ensure .env is in .gitignore',
            'DATABASE_URL=***',
            1,
          ),
        )
      }
    }

    if (
      value === '' &&
      (key.includes('AUTH_') || key.includes('OAUTH_') || key.includes('ID'))
    ) {
      findings.push(
        makeFinding(
          '.env',
          1,
          'medium',
          'configuration',
          `Empty OAuth credential: ${key}`,
          `${key} is empty, social login will fail`,
          `Configure ${key} with valid credentials`,
          `${key}=***`,
        ),
      )
    }

    if (
      value &&
      !key.startsWith('NEXT_PUBLIC_') &&
      !key.startsWith('DATABASE_URL') &&
      (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD') || key.includes('TOKEN'))
    ) {
      findings.push(
        makeFinding(
          '.env',
          1,
          'high',
          'security',
          `Sensitive value: ${key}`,
          `Secret key "${key}" found in .env file`,
          'Consider using a secrets manager for production',
          `${key}=***`,
        ),
      )
    }
  }

  return findings
}

function scanAuthConfig(
  sourceContents: Map<string, string>,
  rootDir: string,
): Finding[] {
  const findings: Finding[] = []

  for (const [filePath, content] of sourceContents) {
    if (content.length > MAX_FILE_SIZE) continue
    if (!filePath.includes('/lib/auth') && !filePath.includes('/api/auth')) continue
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) continue

    const relPath = relativePath(rootDir, filePath)

    if (content.includes('strategy: "jwt"') || content.includes("strategy: 'jwt'")) {
      const line =
        content.split('\n').findIndex(l => l.includes('strategy: "jwt"') || l.includes("strategy: 'jwt'")) + 1
      findings.push(
        makeFinding(
          relPath,
          line,
          'info',
          'auth',
          'JWT session strategy',
          'JWTs cannot be revoked server-side',
          'Consider using database sessions for better security',
          'strategy: "jwt"',
        ),
      )
    }

    if (
      (content.includes('Credentials') || content.includes('credentials')) &&
      content.includes('async authorize')
    ) {
      if (!content.includes('rateLimit') && !content.includes('RateLimit')) {
        const authLine =
          content.indexOf('async authorize') > -1
            ? content.slice(0, content.indexOf('async authorize')).split('\n').length
            : 1
        findings.push(
          makeFinding(
            relPath,
            authLine,
            'high',
            'security',
            'No rate limiting on credentials provider',
            'Credentials-based auth is vulnerable to brute force attacks without rate limiting',
            'Add rate limiting middleware or implement exponential backoff',
          ),
        )
      }

      if (!content.includes('bcrypt') && !content.includes('hash')) {
        findings.push(
          makeFinding(
            relPath,
            1,
            'critical',
            'security',
            'Credentials provider missing password hashing',
            'Password comparison should use bcrypt.compare()',
            'Use bcrypt.compare() for constant-time password verification',
          ),
        )
      }
    }
  }

  return findings
}

function scanSignupRoute(
  sourceContents: Map<string, string>,
  rootDir: string,
): Finding[] {
  const findings: Finding[] = []

  for (const [filePath, content] of sourceContents) {
    if (content.length > MAX_FILE_SIZE) continue
    if (!filePath.includes('/signup') || !filePath.endsWith('.ts')) continue

    const relPath = relativePath(rootDir, filePath)

    const bcryptRounds = findPattern(content, /bcrypt\.hash\([^,]+,\s*(\d+)\)/)
    if (bcryptRounds.length > 0) {
      const br = bcryptRounds[0]!
      const rounds = parseInt(br.match.match(/\d+/)?.[0] || '0', 10)
      if (rounds < 10) {
        findings.push(
          makeFinding(
            relPath,
            br.line,
            'high',
            'security',
            `Low bcrypt salt rounds (${rounds})`,
            `bcrypt salt rounds (${rounds}) are below recommended minimum of 10`,
            `Increase bcrypt.hash(password, 12) to at least 10 rounds`,
            `bcrypt.hash(password, ${rounds})`,
          ),
        )
      }
    }

    if (content.includes('password.length <')) {
      const pwCheck = findPattern(content, /password\.length\s*<\s*(\d+)/)
      if (pwCheck.length > 0) {
        const pw = pwCheck[0]!
        const minLen = parseInt(pw.match.match(/\d+/)?.[0] || '0', 10)
        if (minLen < 8) {
          findings.push(
            makeFinding(
              relPath,
              pw.line,
              'medium',
              'security',
              `Weak password minimum length (${minLen})`,
              `Password minimum length ${minLen} is below recommended minimum of 8`,
              `Increase minimum password length to at least 8 characters`,
            ),
          )
        }
      } else {
        findings.push(
          makeFinding(
            relPath,
            1,
            'medium',
            'missing-validation',
            'Missing password strength validation',
            'No password complexity check found',
            'Add password length and complexity validation',
          ),
        )
      }
    }

    if (!content.includes('email') || (!content.includes('@') && !content.includes('email'))) {
      findings.push(
        makeFinding(
          relPath,
          1,
          'high',
          'missing-validation',
          'Missing email format validation',
          'Signup route does not validate email format',
          'Add email format validation with zod or regex',
        ),
      )
    }
  }

  return findings
}

function scanAuthPages(
  sourceContents: Map<string, string>,
  rootDir: string,
): Finding[] {
  const findings: Finding[] = []

  for (const [filePath, content] of sourceContents) {
    if (content.length > MAX_FILE_SIZE) continue
    if (!filePath.endsWith('.tsx')) continue
    if (!filePath.includes('/auth/signin') && !filePath.includes('/auth/signup')) continue

    const relPath = relativePath(rootDir, filePath)

    if (!content.includes('error') ||
      (!content.includes('error=') && !content.includes('?error'))) {
      findings.push(
        makeFinding(
          relPath,
          1,
          'high',
          'error-handling',
          'Auth page missing error state display',
          'Auth page does not display error messages to users',
          'Add error state display from searchParams.error or signIn result',
        ),
      )
    }

    if (
      content.includes('useState') &&
      !content.includes('loading') &&
      !content.includes('isLoading') &&
      !content.includes('submitting')
    ) {
      findings.push(
        makeFinding(
          relPath,
          1,
          'medium',
          'best-practice',
          'Auth form missing loading state',
          'Form submission may cause double-clicks without loading state',
          'Add isLoading state and disable button during submission',
        ),
      )
    }

    if (content.includes('signIn(') && !content.includes('redirect: false')) {
      findings.push(
        makeFinding(
          relPath,
          1,
          'medium',
          'best-practice',
          'signIn() may redirect and lose context',
          'signIn() without redirect: false will navigate away on error',
          'Add redirect: false to signIn() call for better error handling',
        ),
      )
    }
  }

  return findings
}
