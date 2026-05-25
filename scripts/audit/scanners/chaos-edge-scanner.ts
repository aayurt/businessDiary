import { Scanner, Finding } from '../types'
import { findPattern, makeFinding, relativePath } from '../scanner-utils'

const MAX_FILE_SIZE = 100_000

/**
 * Chaos Edge-Case Scanner
 *
 * Stress-tests Builder output for subtle edge cases:
 *   1. Race conditions (un-awaited promises, Promise.all with ordering)
 *   2. Input validation gaps (req.json() without schema validation)
 *   3. Mass assignment (spreading into db.create)
 *   4. Path traversal in filesystem operations
 *   5. IDOR (insecure direct object references)
 *   6. Unbounded pagination / DoS vectors
 *   7. Error information disclosure
 *   8. Hardcoded configuration
 *   9. Missing CSRF protection
 *  10. Insecure randomness for security
 *  11. Prototype pollution
 *  12. Timing attack vectors
 *  13. Type confusion
 *  14. Session management issues
 *  15. Unvalidated redirects
 *  16. Missing security headers
 */
export const chaosEdgeScanner: Scanner = {
  name: 'Chaos Edge-Case Scanner',

  scan(context): Finding[] {
    const findings: Finding[] = []
    const { rootDir, sourceContents, envVars } = context

    for (const [filePath, content] of sourceContents) {
      if (content.length > MAX_FILE_SIZE) continue
      const relPath = relativePath(rootDir, filePath)

      findings.push(
        ...checkRaceConditions(content, relPath),
        ...checkInputValidationGaps(content, relPath),
        ...checkMassAssignment(content, relPath),
        ...checkPathTraversal(content, relPath),
        ...checkIDOR(content, relPath),
        ...checkUnboundedPagination(content, relPath),
        ...checkErrorDisclosure(content, relPath),
        ...checkHardcodedConfig(content, relPath),
        ...checkCSRF(content, relPath),
        ...checkInsecureRandomness(content, relPath),
        ...checkPrototypePollution(content, relPath),
        ...checkTimingAttacks(content, relPath),
        ...checkTypeConfusion(content, relPath),
        ...checkSessionManagement(content, relPath),
        ...checkUnvalidatedRedirects(content, relPath),
        ...checkSecurityHeaders(content, relPath),
        ...checkDenialOfService(content, relPath),
        ...checkDeprecatedAPIs(content, relPath),
        ...checkMutableStateLeak(content, relPath),
        ...checkCallbackHell(content, relPath),
      )
    }

    return crossReference(findings, sourceContents, envVars, rootDir)
  },
}

/* ------------------------------------------------------------------ */
/*  1. Race Conditions                                                 */
/* ------------------------------------------------------------------ */
function checkRaceConditions(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const awaitedInLoop = findPattern(content, /await\s+\w+\s*\([^)]*\)\s*;\s*\n\s*await/g)
  for (const m of awaitedInLoop) {
    if (content.substring(m.index, m.index + 200).includes('for') ||
        content.substring(Math.max(0, m.index - 100), m.index).includes('forEach')) {
      findings.push(
        makeFinding(relPath, m.line, 'medium', 'edge-case',
          'Sequential awaits in loop (performance)',
          'Awaiting sequentially in a loop slows execution; operations that could run in parallel are serialized',
          'Use Promise.all() to run independent async operations in parallel',
          m.match.substring(0, 40), m.column),
      )
    }
  }

  const promiseAllMissingAwait = findPattern(content, /Promise\.all\(/g)
  for (const m of promiseAllMissingAwait) {
    const segment = content.substring(m.index, m.index + 200)
    if (!segment.startsWith('await ') && !segment.startsWith('return ')) {
      const before = content.substring(Math.max(0, m.index - 40), m.index)
      if (!before.includes('return ') && !before.includes('await ')) {
        findings.push(
          makeFinding(relPath, m.line, 'critical', 'edge-case',
            'Promise.all() not awaited',
            'Promise.all() starts all promises immediately but result is not awaited',
            'Add await before Promise.all()',
            'Promise.all(', m.column),
        )
      }
    }
  }

  const unawaitedAsync = findPattern(content, /\b(\w+)\([^)]*\)\s*;\s*$/gm)
  for (const m of unawaitedAsync) {
    const funcName = m.match.match(/\b(\w+)\s*\(/)
    if (!funcName) continue
    const fn = funcName[1]
    const funcDef = new RegExp(`(async\\s+)?function\\s+${fn}\\s*\\(|const\\s+${fn}\\s*=\\s*async\\s*\\(`)
    if (funcDef.test(content)) {
      const segment = content.substring(Math.max(0, m.index - 60), m.index)
      if (!segment.includes('await ') && !segment.includes('void ')) {
        findings.push(
          makeFinding(relPath, m.line, 'high', 'edge-case',
            `Unhandled async call to "${fn}"`,
            `Async function "${fn}" is called without await - errors will be unhandled promise rejections`,
            `Add await before the call or use .catch()`,
            m.match.substring(0, 40), m.column),
        )
      }
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/*  2. Input Validation Gaps                                           */
/* ------------------------------------------------------------------ */
function checkInputValidationGaps(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const jsonParse = findPattern(content, /req\.json\(|request\.json\(/g)

  for (const m of jsonParse) {
    const segment = content.substring(m.index, m.index + 800)
    const hasZod = segment.includes('zod') && (segment.includes('.parse(') || segment.includes('.safeParse('))
    const hasManualCheck = /if\s*\([^)]*!(email|name|password|title|content)/.test(segment)
    const hasTypeCheck = /typeof\s+\w+\s*===\s*['"]string['"]/.test(segment)
    const hasTryCatch = segment.includes('try') && segment.includes('catch')

    if (!hasZod && !hasManualCheck && !hasTypeCheck) {
      findings.push(
        makeFinding(relPath, m.line, 'high', 'edge-case',
          'Request body parsed without validation',
          'req.json() data used without schema validation (zod, yup, or manual checks)',
          'Add a zod schema: const schema = z.object({...}); const data = schema.parse(body)',
          'req.json()', m.column),
      )
    }

    if (!hasTryCatch) {
      findings.push(
        makeFinding(relPath, m.line, 'medium', 'edge-case',
          'req.json() not in try/catch',
          'req.json() can throw if JSON is malformed, crashing the handler',
          'Wrap req.json() in try/catch or use a JSON parsing helper',
          'req.json()', m.column),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/*  3. Mass Assignment                                                 */
/* ------------------------------------------------------------------ */
function checkMassAssignment(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const spreadIntoDb = findPattern(content, /db\.\w+\.(create|update)\s*\(\s*\{[^}]*\.\.\./g)
  for (const m of spreadIntoDb) {
    findings.push(
      makeFinding(relPath, m.line, 'critical', 'edge-case',
        'Mass assignment via spread into db.create/update',
        'Spreading user-controlled data into database operations allows setting any field',
        'Explicitly whitelist fields instead of spreading: data: { name: body.name, email: body.email }',
        m.match.substring(0, 50), m.column),
    )
  }

  const objectAssign = findPattern(content, /Object\.assign\s*\(\s*\{\s*[^}]*\},\s*\w+/g)
  for (const m of objectAssign) {
    const before = content.substring(Math.max(0, m.index - 100), m.index)
    if (before.includes('req.') || before.includes('body') || before.includes('input')) {
      findings.push(
        makeFinding(relPath, m.line, 'high', 'edge-case',
          'Object.assign with user input',
          'Object.assign may copy unexpected properties from user-controlled objects',
          'Explicitly copy only expected properties',
          m.match.substring(0, 40), m.column),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/*  4. Path Traversal                                                  */
/* ------------------------------------------------------------------ */
function checkPathTraversal(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const fsPatterns = findPattern(content, /\b(readFileSync|readFile|writeFileSync|writeFile|existsSync|unlinkSync|rmSync|cpSync|copyFileSync|accessSync|mkdirSync|readdirSync)\s*\(/g)
  for (const m of fsPatterns) {
    const argsEnd = content.indexOf(')', m.index)
    if (argsEnd === -1) continue
    const args = content.substring(m.index, argsEnd + 1)

    const hasUserInput = /\b(req\.|params\.|query\.|body\.|input\.|file\.|\.name\b|\.path\b)/.test(args)
    const hasPathJoin = args.includes('path.join') || args.includes('path.resolve')
    const hasSafePath = /\.(basename|extname)/.test(args)

    if (hasUserInput && !hasPathJoin && !hasSafePath) {
      findings.push(
        makeFinding(relPath, m.line, 'critical', 'edge-case',
          'Path traversal vulnerability',
          'User input used in filesystem path without path.join() or basename validation',
          'Use path.join() + path.basename() to sanitize file paths',
          m.match.substring(0, 30), m.column),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/*  5. IDOR - Insecure Direct Object Reference                         */
/* ------------------------------------------------------------------ */
function checkIDOR(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const dbFindUnique = findPattern(content, /db\.\w+\.findUnique\s*\(\s*\{[^}]*where:\s*\{[^}]*id:\s*(req\.|params\.|body\.|query\.|searchParams)/g)
  for (const m of dbFindUnique) {
    const segment = content.substring(0, m.index + m.match.length)
    const hasOwnershipCheck = segment.includes('userId') || segment.includes('authorId') || segment.includes('ownerId') ||
      findPattern(content.substring(m.index, m.index + 500), /where\s*:\s*\{[^}]*userId/g).length > 0

    if (!hasOwnershipCheck) {
      findings.push(
        makeFinding(relPath, m.line, 'critical', 'edge-case',
          'Potential IDOR: Direct object reference without ownership check',
          'Using user-supplied ID to query database without verifying the user owns the resource',
          'Add ownership check: verify current user ID matches resource owner before returning data',
          m.match.substring(0, 50), m.column),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/*  6. Unbounded Pagination / DoS                                      */
/* ------------------------------------------------------------------ */
function checkUnboundedPagination(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const findMany = findPattern(content, /db\.\w+\.findMany\s*\(/g)
  for (const m of findMany) {
    const segment = content.substring(m.index, m.index + 400)
    const hasTake = /take\s*:/i.test(segment)
    const hasLimit = /\btake\s*[:=]\s*\d+/.test(segment)

    if (!hasTake) {
      findings.push(
        makeFinding(relPath, m.line, 'high', 'edge-case',
          'Unbounded database query (potential DoS)',
          'findMany() without take/limit can return all rows - performance risk for large tables',
          'Add take: <maxResults> to limit result set size',
          'db.xxx.findMany(', m.column),
      )
    }

    if (hasTake && !hasLimit) {
      const hasUserTake = /\btake\s*[:=]\s*(req\.|params\.|body\.|query\.|searchParams)/.test(segment)
      if (hasUserTake) {
        const hasSanitize = segment.includes('Math.min') || segment.includes('clamp') || segment.includes('&&')
        if (!hasSanitize) {
          findings.push(
            makeFinding(relPath, m.line, 'high', 'edge-case',
              'User-controlled pagination limit without sanitization',
              'User-supplied limit value passed directly to take without upper bound',
              'Add cap: take: Math.min(userLimit, 100)',
              m.match.substring(0, 30), m.column),
          )
        }
      }
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/*  7. Error Information Disclosure                                    */
/* ------------------------------------------------------------------ */
function checkErrorDisclosure(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const catchWithRawError = findPattern(content, /catch\s*\((\w+)\)\s*\{[^}]*\b\1\.message/g)
  for (const m of catchWithRawError) {
    const segment = content.substring(m.index, m.index + 300)
    const varName = m.match.match(/catch\s*\((\w+)\)/)?.[1]
    if (!varName) continue

    const returnsError = new RegExp(`${varName}\\.message`).test(segment)
    const returnsToClient = segment.includes('json(') || segment.includes('send(')
    const hasSanitization = segment.includes('Internal') || segment.includes('generic') ||
      segment.includes('safe') || segment.includes('sanitize')

    if (returnsError && returnsToClient && !hasSanitization) {
      findings.push(
        makeFinding(relPath, m.line, 'high', 'edge-case',
          'Error information disclosure in response',
          'Raw error.message returned to client may leak internal details',
          'Return a generic error message to clients and log the actual error server-side',
          m.match.substring(0, 50), m.column),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/*  8. Hardcoded Configuration                                         */
/* ------------------------------------------------------------------ */
function checkHardcodedConfig(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const hardcodedUrls = findPattern(
    content,
    /https?:\/\/localhost[^\s"']*|https?:\/\/127\.0\.0\.1[^\s"']*/g,
  )
  for (const m of hardcodedUrls) {
    findings.push(
      makeFinding(relPath, m.line, 'medium', 'edge-case',
        'Hardcoded localhost URL',
        'Hardcoded localhost URL will break in production or different environments',
        'Move to environment variables: process.env.API_URL',
        m.match, m.column),
    )
  }

  const hardcodedPorts = findPattern(content, /:\b(3000|4000|5000|8080|8000|9000)\b/g)
  for (const m of hardcodedPorts) {
    const line = content.split('\n')[m.line - 1]
    if (!line || line.trim().startsWith('//')) continue
    if (line.includes('PORT') || line.includes('port')) continue
    findings.push(
      makeFinding(relPath, m.line, 'low', 'edge-case',
        'Hardcoded port number',
        `Hardcoded port ${m.match} may conflict in different environments`,
        'Use process.env.PORT with a default fallback',
        m.match, m.column),
    )
  }

  const hardcodedTimeouts = findPattern(content, /\b(timeout|ttl|maxAge)\s*[:=]\s*\d{4,}\b/gi)
  for (const m of hardcodedTimeouts) {
    findings.push(
      makeFinding(relPath, m.line, 'low', 'edge-case',
        'Hardcoded timeout/ttl value',
        'Hardcoded timeout/TTL values may need adjustment per environment',
        'Move to configuration or environment variables',
        m.match, m.column),
    )
  }

  return findings
}

/* ------------------------------------------------------------------ */
/*  9. Missing CSRF Protection                                         */
/* ------------------------------------------------------------------ */
function checkCSRF(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  if (!filePathIncludes(relPath, 'api')) return findings

  const hasCSRFToken = content.includes('csrf') || content.includes('CSRF') ||
    content.includes('xsrf') || content.includes('XSRF') ||
    content.includes('X-CSRF') || content.includes('SameSite')

  const hasMutation = /db\.\w+\.(create|update|upsert|delete)\s*\(/.test(content)

  if (hasMutation && !hasCSRFToken) {
    const handlerLines = findPattern(content, /export\s+(async\s+)?function\s+(POST|PUT|PATCH|DELETE)\s*\(/g)
    for (const m of handlerLines) {
      findings.push(
        makeFinding(relPath, m.line, 'medium', 'edge-case',
          'API mutation without CSRF protection',
          'POST/PUT/PATCH/DELETE handler may be vulnerable to CSRF attacks',
          'Add CSRF token validation or use SameSite=Strict cookies',
          m.match, m.column),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/* 10. Insecure Randomness (for security)                              */
/* ------------------------------------------------------------------ */
function checkInsecureRandomness(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const hasMathRandom = content.includes('Math.random()')
  if (!hasMathRandom) return findings

  const securityPattern = /(token|secret|key|password|nonce|csrf|session|salt|hash|otp|mfa|reset|auth)/gi
  if (securityPattern.test(content)) {
    const matches = findPattern(content, /Math\.random\(\)/g)
    for (const m of matches) {
      findings.push(
        makeFinding(relPath, m.line, 'critical', 'edge-case',
          'Math.random() used near security-sensitive code',
          'Math.random() is not cryptographically secure',
          'Use crypto.randomUUID() or require("crypto").randomBytes()',
          'Math.random()', m.column),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/* 11. Prototype Pollution                                             */
/* ------------------------------------------------------------------ */
function checkPrototypePollution(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const spreadPatterns = findPattern(content, /\{\.\.\.\w+\}/g)
  for (const m of spreadPatterns) {
    const segment = content.substring(Math.max(0, m.index - 100), m.index)
    if (segment.includes('body') || segment.includes('req.') || segment.includes('input')) {
      findings.push(
        makeFinding(relPath, m.line, 'high', 'edge-case',
          'Object spread from user input',
          'Spreading user-controlled objects can introduce prototype pollution via __proto__',
          'Sanitize input objects before spreading: JSON.parse(JSON.stringify(obj))',
          m.match, m.column),
      )
    }
  }

  const mergePatterns = findPattern(content, /(merge|assign|extend)\s*\(\s*\{\s*[^}]*\},\s*\w+\s*\)/g)
  for (const m of mergePatterns) {
    const before = content.substring(Math.max(0, m.index - 60), m.index)
    if (before.includes('body') || before.includes('req.') || before.includes('input') || before.includes('user')) {
      findings.push(
        makeFinding(relPath, m.line, 'high', 'edge-case',
          'Potential prototype pollution via merge/assign',
          'Merging user-controlled objects without protection can pollute Object.prototype',
          'Use a safe merge utility or sanitize keys with hasOwnProperty check',
          m.match.substring(0, 40), m.column),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/* 12. Timing Attack Vectors                                           */
/* ------------------------------------------------------------------ */
function checkTimingAttacks(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const passwordCompares = findPattern(content, /===\s*password|===\s*token|===\s*secret/gi)
  for (const m of passwordCompares) {
    const segment = content.substring(Math.max(0, m.index - 60), m.index + 60)
    const hasTimingSafe = segment.includes('timingSafeEqual') || segment.includes('compare') ||
      segment.includes('bcrypt') || segment.includes('constant')

    if (!hasTimingSafe) {
      findings.push(
        makeFinding(relPath, m.line, 'high', 'edge-case',
          'Timing attack vulnerability',
          'String comparison with === on sensitive value is vulnerable to timing attacks',
          'Use crypto.timingSafeEqual() or bcrypt.compare() for secret comparison',
          m.match, m.column),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/* 13. Type Confusion                                                  */
/* ------------------------------------------------------------------ */
function checkTypeConfusion(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const doubleNegation = findPattern(content, /!!\w+/g)
  for (const m of doubleNegation) {
    const line = content.split('\n')[m.line - 1]
    if (line && !line.trim().startsWith('//')) {
      findings.push(
        makeFinding(relPath, m.line, 'low', 'edge-case',
          'Double negation (!!) may mask type issues',
          '!! coerces to boolean but can mask null/undefined distinction',
          'Use Boolean() or explicit comparison for clarity',
          m.match, m.column),
      )
    }
  }

  const equalityMismatch = findPattern(content, /\b(\d+)\s*===\s*['"]\w+['"]|['"]\w+['"]\s*===\s*(\d+)/g)
  for (const m of equalityMismatch) {
    findings.push(
      makeFinding(relPath, m.line, 'high', 'edge-case',
        'Type mismatch in equality check',
        'Comparing number with string using === will always be false',
        'Ensure both sides of === are the same type',
        m.match, m.column),
    )
  }

  return findings
}

/* ------------------------------------------------------------------ */
/* 14. Session Management Issues                                       */
/* ------------------------------------------------------------------ */
function checkSessionManagement(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const noSessionRegen = content.includes('signIn') && !content.includes('regenerate')
  if (noSessionRegen) {
    const signInLines = findPattern(content, /\bsignIn\s*\(/g)
    for (const m of signInLines) {
      findings.push(
        makeFinding(relPath, m.line, 'medium', 'edge-case',
          'No session regeneration after sign-in',
          'Session should be regenerated after authentication to prevent session fixation',
          'Call session.regenerate() or re-create session after successful login',
          'signIn(', m.column),
      )
    }
  }

  const noSessionExpiry = content.includes('session') && !content.includes('expires') &&
    !content.includes('maxAge')
  if (noSessionExpiry && content.includes('NextAuth')) {
    findings.push(
      makeFinding(relPath, 1, 'medium', 'edge-case',
        'No explicit session expiration configured',
        'Session has no explicit maxAge or expiration set',
        'Configure session maxAge in auth config: session: { maxAge: 60 * 60 * 24 }',
      ),
    )
  }

  return findings
}

/* ------------------------------------------------------------------ */
/* 15. Unvalidated Redirects                                           */
/* ------------------------------------------------------------------ */
function checkUnvalidatedRedirects(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const redirectPatterns = findPattern(content, /(redirect|router\.push|router\.replace)\s*\([^)]*\b(?:url|to|path|redirect|callbackUrl|returnUrl|next)\b[^)]*\)/gi)
  for (const m of redirectPatterns) {
    const segment = content.substring(m.index, m.index + 200)
    const hasValidation = segment.includes('startsWith') || segment.includes('URL') ||
      segment.includes('new URL') || segment.includes('validate') || segment.includes('allowed')

    if (!hasValidation) {
      findings.push(
        makeFinding(relPath, m.line, 'high', 'edge-case',
          'Unvalidated redirect',
          'User-controlled redirect URL without validation - can be used for phishing',
          'Validate redirect URLs against an allowlist or use relative paths only',
          m.match.substring(0, 50), m.column),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/* 16. Missing Security Headers                                        */
/* ------------------------------------------------------------------ */
function checkSecurityHeaders(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  if (!relPath.includes('next.config') && !relPath.includes('middleware')) return findings

  const securityHeaders = [
    { name: 'X-Frame-Options', pattern: /X-Frame-Options/i },
    { name: 'X-Content-Type-Options', pattern: /X-Content-Type-Options/i },
    { name: 'Content-Security-Policy', pattern: /Content-Security-Policy/i },
    { name: 'Strict-Transport-Security', pattern: /Strict-Transport-Security/i },
    { name: 'X-XSS-Protection', pattern: /X-XSS-Protection/i },
  ]

  for (const header of securityHeaders) {
    if (!header.pattern.test(content)) {
      findings.push(
        makeFinding(relPath, 1, 'medium', 'edge-case',
          `Missing security header: ${header.name}`,
          `Response is missing the ${header.name} security header`,
          `Add ${header.name} to your response headers configuration`,
        ),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/* 17. Denial of Service Vectors                                       */
/* ------------------------------------------------------------------ */
function checkDenialOfService(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const recursivePatterns = findPattern(content, /function\s+(\w+)[^}]*\b\1\s*\(/g)
  for (const m of recursivePatterns) {
    const segment = content.substring(m.index, m.index + 500)
    if (!segment.includes('if ') && !segment.includes('return')) {
      findings.push(
        makeFinding(relPath, m.line, 'high', 'edge-case',
          'Unbounded recursion (potential stack overflow)',
          'Recursive function without base case visible in function body',
          'Add a terminating condition to prevent infinite recursion',
          m.match.substring(0, 40), m.column),
      )
    }
  }

  const loopWithoutBounds = findPattern(content, /while\s*\(\s*true\s*\)/gi)
  for (const m of loopWithoutBounds) {
    const segment = content.substring(m.index, m.index + 400)
    if (!segment.includes('break') && !segment.includes('return')) {
      findings.push(
        makeFinding(relPath, m.line, 'critical', 'edge-case',
          'Infinite while(true) loop with no break',
          'while(true) without break or return will hang the event loop',
          'Add a break condition or return statement inside the loop',
          'while (true)', m.column),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/* 18. Deprecated / Risky API Usage                                    */
/* ------------------------------------------------------------------ */
function checkDeprecatedAPIs(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const deprecatedPatterns = [
    { pattern: /\bfindSync\b/g, msg: 'Legacy synchronous operation may block event loop', fix: 'Use async alternatives' },
    { pattern: /\bexecSync\b/g, msg: 'Synchronous shell execution blocks the event loop', fix: 'Use async exec or spawn' },
    { pattern: /\bchild_process\.exec\b/g, msg: 'Shell command injection risk with exec()', fix: 'Use execFile() or spawn() with args array' },
    { pattern: /\bBuffer\(\s*['"]/g, msg: 'Buffer() constructor is deprecated', fix: 'Use Buffer.from(), Buffer.alloc()' },
    { pattern: /\b\.substr\(/g, msg: 'String.prototype.substr() is deprecated', fix: 'Use .slice() or .substring()' },
  ]

  for (const { pattern, msg, fix } of deprecatedPatterns) {
    const matches = findPattern(content, pattern)
    for (const m of matches) {
      findings.push(
        makeFinding(relPath, m.line, 'low', 'edge-case', 'Deprecated API usage', msg, fix, m.match, m.column),
      )
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/* 19. Mutable State Leaked from Server to Client                      */
/* ------------------------------------------------------------------ */
function checkMutableStateLeak(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  if (relPath.includes('layout.tsx') || relPath.includes('page.tsx')) {
    const sharedState = findPattern(content, /(const|let)\s+\w+\s*=\s*\{\s*\}[\s\S]*?(export|function)/g)
    for (const m of sharedState) {
      if (m.match.includes('let')) {
        findings.push(
          makeFinding(relPath, m.line, 'high', 'edge-case',
            'Mutable module-level state in server component',
            'Module-level state in server components is shared across requests in production',
            'Use request-scoped storage or avoid mutable module state',
            m.match.substring(0, 40), m.column),
        )
      }
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/* 20. Deeply Nested Callbacks / Pyramid of Doom                       */
/* ------------------------------------------------------------------ */
function checkCallbackHell(content: string, relPath: string): Finding[] {
  const findings: Finding[] = []

  const lines = content.split('\n')
  let maxNesting = 0
  let currentNesting = 0
  let lineNum = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const openParens = (line.match(/\(/g) || []).length
    const closeParens = (line.match(/\)/g) || []).length
    const openBraces = (line.match(/\{/g) || []).length
    const closeBraces = (line.match(/\}/g) || []).length

    if (line.includes('=>') || line.includes('function (')) {
      currentNesting += openParens - closeParens + openBraces - closeBraces
    }

    if (currentNesting > maxNesting) {
      maxNesting = currentNesting
      lineNum = i + 1
    }

    if (closeBraces > openBraces) {
      currentNesting -= closeBraces - openBraces
    }
    if (closeParens > openParens) {
      currentNesting -= closeParens - openParens
    }
  }

  if (maxNesting > 5) {
    findings.push(
      makeFinding(relPath, lineNum, 'medium', 'edge-case',
        `Deep nesting detected (depth: ${maxNesting})`,
        `Code has deeply nested callbacks/promises (depth ${maxNesting}) which is hard to maintain`,
        'Refactor with async/await, extract named functions, or use a flow control library',
      ),
    )
  }

  return findings
}

/* ------------------------------------------------------------------ */
/* Cross-Reference Analysis                                            */
/* ------------------------------------------------------------------ */
function crossReference(
  findings: Finding[],
  _sourceContents: Map<string, string>,
  _envVars: Record<string, string>,
  _rootDir: string,
): Finding[] {
  const result = [...findings]
  const categories = new Set(findings.map(f => f.category))
  const filesWithFindings = new Set(findings.map(f => f.file))

  if (categories.size >= 4 && filesWithFindings.size >= 3) {
    result.push({
      file: '(cross-reference)',
      line: 1,
      severity: 'info',
      category: 'edge-case',
      title: 'Multiple issue categories detected',
      message: `Found ${findings.length} issues across ${categories.size} categories in ${filesWithFindings.size} files - suggests systemic quality gaps`,
      suggestedFix: 'Run a comprehensive code review focusing on the weakest areas',
    })
  }

  return result
}

function filePathIncludes(relPath: string, segment: string): boolean {
  return relPath.includes(`/${segment}/`) || relPath.startsWith(`${segment}/`)
}
