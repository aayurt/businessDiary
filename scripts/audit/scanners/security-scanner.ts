import { Scanner, Finding } from '../types'
import { findPattern, makeFinding, relativePath } from '../scanner-utils'

const MAX_FILE_SIZE = 50_000

export const securityScanner: Scanner = {
  name: 'Security Vulnerability Scanner',

  scan(context): Finding[] {
    const findings: Finding[] = []
    const { rootDir, sourceContents } = context

    for (const [filePath, content] of sourceContents) {
      if (content.length > MAX_FILE_SIZE) continue

      const relPath = relativePath(rootDir, filePath)

      findings.push(
        ...checkXSSVectors(content, relPath),
        ...checkHardcodedCredentials(content, relPath),
        ...checkDangerousFunctions(content, relPath),
        ...checkPathTraversal(content, relPath),
        ...checkInsecureRandomness(content, relPath),
        ...checkDangerousHeaders(content, relPath),
        ...checkSQLInjection(content, relPath),
      )
    }

    return findings
  },
}

function checkXSSVectors(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []
  const xssPatterns = [
    {
      pattern: /dangerouslySetInnerHTML/g,
      severity: 'critical' as const,
      label: 'dangerouslySetInnerHTML usage',
      msg: 'Direct HTML injection vulnerability',
      fix: 'Use a sanitization library like DOMPurify or use React components instead',
    },
    {
      pattern: /\.innerHTML\s*=/g,
      severity: 'critical' as const,
      label: 'innerHTML assignment',
      msg: 'Direct HTML injection via innerHTML',
      fix: 'Use textContent or React rendering instead',
    },
    {
      pattern: /document\.write\s*\(/g,
      severity: 'critical' as const,
      label: 'document.write() usage',
      msg: 'document.write() can overwrite entire document',
      fix: 'Use DOM manipulation methods instead',
    },
  ]

  for (const { pattern, severity, label, msg, fix } of xssPatterns) {
    const matches = findPattern(content, pattern)
    for (const m of matches) {
      const line = content.split('\n')[m.line - 1]
      if (line && (line.trim().startsWith('//') || line.trim().startsWith('*'))) continue

      findings.push(
        makeFinding(relPath, m.line, severity, 'security', label, msg, fix, m.match, m.column),
      )
    }
  }

  return findings
}

function checkHardcodedCredentials(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []
  const patterns = [
    {
      pattern: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"']{3,}["']/gi,
      sev: 'critical' as const,
      label: 'Hardcoded password',
      fix: 'Move to environment variables',
    },
    {
      pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][^"']{8,}["']/gi,
      sev: 'critical' as const,
      label: 'Hardcoded API key',
      fix: 'Move to environment variables',
    },
    {
      pattern: /(?:secret|token)\s*[:=]\s*["'][^"']{8,}["']/gi,
      sev: 'critical' as const,
      label: 'Hardcoded secret/token',
      fix: 'Move to environment variables',
    },
    {
      pattern: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH|PGP)\s+PRIVATE\s+KEY-----/g,
      sev: 'critical' as const,
      label: 'Private key detected',
      fix: 'Remove private key from source code and use secrets management',
    },
  ]

  for (const { pattern, sev, label, fix } of patterns) {
    const matches = findPattern(content, pattern)
    for (const m of matches) {
      const line = content.split('\n')[m.line - 1]
      if (line && line.trim().startsWith('//')) continue

      findings.push(
        makeFinding(
          relPath,
          m.line,
          sev,
          'security',
          label,
          'Potential hardcoded credential in source code',
          fix,
          m.match.length > 30 ? m.match.slice(0, 30) + '...' : m.match,
          m.column,
        ),
      )
    }
  }

  return findings
}

function checkDangerousFunctions(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []
  const dangerous = [
    {
      pattern: /\beval\s*\(/g,
      sev: 'critical' as const,
      label: 'eval() usage',
      msg: 'eval() executes arbitrary code and is a major security risk',
      fix: 'Remove eval() - use JSON.parse() for JSON, or Function constructor as last resort',
    },
    {
      pattern: /\bnew\s+Function\s*\(/g,
      sev: 'high' as const,
      label: 'new Function() usage',
      msg: 'Dynamic function creation can lead to code injection',
      fix: 'Avoid dynamic code generation',
    },
    {
      pattern: /\bsetTimeout\s*\(\s*["']/g,
      sev: 'medium' as const,
      label: 'setTimeout with string argument',
      msg: 'String argument to setTimeout is eval-based',
      fix: 'Pass a function reference instead of a string',
    },
    {
      pattern: /\bsetInterval\s*\(\s*["']/g,
      sev: 'medium' as const,
      label: 'setInterval with string argument',
      msg: 'String argument to setInterval is eval-based',
      fix: 'Pass a function reference instead of a string',
    },
  ]

  for (const { pattern, sev, label, msg, fix } of dangerous) {
    const matches = findPattern(content, pattern)
    for (const m of matches) {
      const line = content.split('\n')[m.line - 1]
      if (line && (line.trim().startsWith('//') || line.trim().startsWith('*'))) continue

      findings.push(
        makeFinding(relPath, m.line, sev, 'security', label, msg, fix, m.match, m.column),
      )
    }
  }

  return findings
}

function checkPathTraversal(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  const fsCalls = findPattern(
    content,
    /\b(?:readFileSync|readFile|writeFileSync|writeFile|readdirSync|readdir|existsSync|unlinkSync|rmSync|cpSync|copyFileSync)\s*\(/g,
  )

  for (const m of fsCalls) {
    const argsEnd = content.indexOf(')', m.index)
    if (argsEnd === -1) continue
    const args = content.substring(m.index, argsEnd + 1)

    const hasJoin = args.includes('path.join') || args.includes('path.resolve')
    const hasConcat = args.includes('+ ') || args.includes('`')
    const hasVariable = /\$\{|\.replace\(/.test(args)

    if (hasConcat || (hasVariable && !hasJoin)) {
      findings.push(
        makeFinding(
          relPath,
          m.line,
          'high',
          'security',
          'Potential path traversal vulnerability',
          'File system operation uses string concatenation for paths',
          'Use path.join() or path.resolve() to construct safe file paths',
          m.match,
          m.column,
        ),
      )
    }
  }

  return findings
}

function checkInsecureRandomness(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []
  const hasMathRandom = content.includes('Math.random()')

  if (hasMathRandom) {
    const cryptoPatterns =
      /(?:token|secret|key|password|nonce|csrf|session|salt|hash|otp|mfa)/gi
    const isSecurityContext = cryptoPatterns.test(content)

    if (isSecurityContext) {
      const matches = findPattern(content, /Math\.random\(\)/g)
      for (const m of matches) {
        findings.push(
          makeFinding(
            relPath,
            m.line,
            'critical',
            'security',
            'Insecure randomness for security context',
            'Math.random() is not cryptographically secure - used near security-sensitive terms',
            'Use crypto.randomBytes() or web crypto API getRandomValues()',
            'Math.random()',
            m.column,
          ),
        )
      }
    }
  }

  return findings
}

function checkDangerousHeaders(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  const corsHeaders = findPattern(
    content,
    /['"]Access-Control-Allow-Origin['"]\s*:\s*['"]\*['"]/g,
  )

  for (const m of corsHeaders) {
    findings.push(
      makeFinding(
        relPath,
        m.line,
        'high',
        'security',
        'Permissive CORS header',
        'Access-Control-Allow-Origin: * allows any origin to access the API',
        'Restrict to specific origins: Access-Control-Allow-Origin: https://yourdomain.com',
        m.match,
        m.column,
      ),
    )
  }

  return findings
}

function checkSQLInjection(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  const queryPatterns = findPattern(
    content,
    /\${\s*\w+\s*}\s*`|['"]\s*\+\s*\w+\s*\+\s*['"]/g,
  )

  for (const m of queryPatterns) {
    const line = content.split('\n')[m.line - 1]
    if (!line) continue

    const isSQLContext =
      line.includes('query(') ||
      line.includes('execute(') ||
      line.includes('raw(') ||
      line.includes('sql')

    if (isSQLContext) {
      findings.push(
        makeFinding(
          relPath,
          m.line,
          'critical',
          'security',
          'Potential SQL injection',
          'String interpolation used in SQL query context',
          'Use parameterized queries or Prisma prepared statements',
          m.match,
          m.column,
        ),
      )
    }
  }

  return findings
}
