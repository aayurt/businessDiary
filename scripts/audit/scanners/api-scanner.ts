import { Scanner, Finding } from '../types'
import { findPattern, makeFinding, relativePath } from '../scanner-utils'

const MAX_FILE_SIZE = 50_000

export const apiScanner: Scanner = {
  name: 'API Route Scanner',

  scan(context): Finding[] {
    const findings: Finding[] = []
    const { rootDir, sourceContents } = context

    for (const [filePath, content] of sourceContents) {
      if (content.length > MAX_FILE_SIZE) continue
      if (!filePath.includes('/api/') || !filePath.endsWith('.ts')) continue
      if (!content.includes('export')) continue

      const relPath = relativePath(rootDir, filePath)

      const exportedHandlers = findPattern(
        content,
        /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g,
      )

      if (exportedHandlers.length === 0) {
        const hasHandlerExport =
          content.includes('export const') &&
          /\b(GET|POST|PUT|PATCH|DELETE)\b/.test(content)
        if (!hasHandlerExport) continue
      }

      const handlers = exportedHandlers.length > 0
        ? exportedHandlers
        : [{ match: 'export', index: content.indexOf('export'), line: 1, column: 1 }]

      for (const handler of handlers) {
        const handlerSegment = content.substring(handler.index)
        const openingBrace = handlerSegment.indexOf('{')
        if (openingBrace === -1) continue
        const body = handlerSegment.substring(openingBrace)

        if (!body.includes('try') || !body.includes('catch')) {
          const httpMethod = handler.match.match(/GET|POST|PUT|PATCH|DELETE/) || 'handler'
          findings.push(
            makeFinding(
              relPath,
              handler.line,
              'critical',
              'error-handling',
              `API route "${httpMethod}" has no try/catch`,
              `HTTP handler may throw uncaught exceptions causing 500 errors`,
              `Wrap handler body in try/catch and return appropriate error responses`,
              `export async function ${httpMethod}(`,
              handler.column,
            ),
          )
        }

        if (content.includes('req.json') || content.includes('request.json')) {
          const hasValidation =
            body.includes('zod') ||
            body.includes('.parse(') ||
            body.includes('.safeParse(') ||
            findPattern(body, /if\s*\([^)]*!(email|name|password|title|content)/).length > 0 ||
            findPattern(body, /if\s*\([^)]*=== undefined/).length > 0 ||
            findPattern(body, /typeof\s+\w+\s*===\s*['"]string['"]/).length > 0

          if (!hasValidation) {
            findings.push(
              makeFinding(
                relPath,
                handler.line,
                'high',
                'missing-validation',
                `Missing input validation for request body`,
                `Handler calls req.json() but doesn't validate the parsed body with zod or manual checks`,
                `Add zod schema: const schema = z.object({...}); schema.parse(body)`,
              ),
            )
          }
        }

        const catchBlocks = findPattern(body, /catch\s*(\([^)]*\))?\s*\{/g)
        for (const cb of catchBlocks) {
          const catchSegment = body.substring(cb.index)
          const catchBodyEnd = findMatchingBrace(catchSegment)
          const catchBody = catchSegment.substring(0, catchBodyEnd)

          if (
            !catchBody.includes('500') &&
            !catchBody.includes('5') &&
            !catchBody.includes('Internal')
          ) {
            findings.push(
              makeFinding(
                relPath,
                handler.line + catchBody.substring(0, 100).split('\n').length - 1,
                'medium',
                'error-handling',
                `Catch block may not return 5xx status`,
                `Catch block should return a 500-level status code for unhandled errors`,
                `Add: return NextResponse.json({ error: msg }, { status: 500 })`,
              ),
            )
          }
        }
      }
    }

    return findings
  },
}

function findMatchingBrace(s: string): number {
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') depth++
    else if (s[i] === '}') {
      depth--
      if (depth === 0) return i + 1
    }
  }
  return s.length
}
