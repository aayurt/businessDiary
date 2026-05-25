import { Scanner, Finding } from '../types'
import { findPattern, makeFinding, relativePath } from '../scanner-utils'

const MAX_FILE_SIZE = 50_000

export const tsScanner: Scanner = {
  name: 'TypeScript Issue Scanner',

  scan(context): Finding[] {
    const findings: Finding[] = []
    const { rootDir, sourceContents } = context

    for (const [filePath, content] of sourceContents) {
      if (content.length > MAX_FILE_SIZE) continue
      if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) continue

      const relPath = relativePath(rootDir, filePath)

      findings.push(
        ...checkTypeAssertions(content, relPath),
        ...checkNonNullAssertions(content, relPath),
        ...checkMissingErrorHandling(content, relPath),
        ...checkMissingReturnTypes(content, relPath),
        ...checkLooseEquality(content, relPath),
        ...checkLargeImports(content, relPath),
        ...checkAnyTypes(content, relPath),
      )
    }

    return findings
  },
}

function checkTypeAssertions(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  const angleAssertions = findPattern(content, /<(\w+)>/g)
  for (const m of angleAssertions) {
    const before = content.substring(Math.max(0, m.index - 20), m.index)
    if (
      /(?:const|let|var|return|as|:)\s*$/.test(before) &&
      !before.includes('//') &&
      !before.includes('import')
    ) {
      const line = content.split('\n')[m.line - 1]
      if (line && !line.trim().startsWith('//') && !line.includes('jsx') && !line.includes('JSX')) {
        findings.push(
          makeFinding(
            relPath,
            m.line,
            'medium',
            'typescript',
            'Angle-bracket type assertion',
            'Angle-bracket type assertions can be confused with JSX tags',
            'Use "as" keyword instead: value as Type',
            m.match,
            m.column,
          ),
        )
      }
    }
  }

  return findings
}

function checkNonNullAssertions(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  const nonNullMatches = findPattern(content, /(\w+)!/g)
  for (const m of nonNullMatches) {
    const line = content.split('\n')[m.line - 1]
    if (!line || m.match.length <= 1 || m.match.endsWith('!!')) continue
    if (line.trim().startsWith('//')) continue

    const after = content[m.index + m.match.length] || ''
    if (
      after === '.' ||
      after === '[' ||
      after === ')' ||
      after === ',' ||
      after === ';' ||
      after === ' ' ||
      after === '\n' ||
      after === '}' ||
      after === ']' ||
      after === '!'
    ) {
      findings.push(
        makeFinding(
          relPath,
          m.line,
          'medium',
          'typescript',
          'Non-null assertion (!)',
          'Non-null assertion bypasses TypeScript null safety',
          'Use optional chaining (?.) or proper null check with if guard',
          '!',
          m.column,
        ),
      )
    }
  }

  return findings
}

function checkMissingErrorHandling(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  const asyncFuncs = findPattern(content, /\basync\s+function\b/g)
  for (const m of asyncFuncs) {
    const segment = content.substring(
      Math.max(0, m.index - 100),
      Math.min(content.length, m.index + 500),
    )
    const bodyStart = segment.indexOf('{')
    if (bodyStart === -1) continue
    const body = segment.substring(bodyStart)
    const hasTryCatch = body.includes('try') && body.includes('catch')

    if (!hasTryCatch) {
      const funcName = content
        .substring(m.index, m.index + 100)
        .match(/async\s+function\s+(\w+)/)

      if (funcName && !funcName[1]!.startsWith('_')) {
        findings.push(
          makeFinding(
            relPath,
            m.line,
            'medium',
            'error-handling',
            `Async function "${funcName[1]}" has no try/catch`,
            `Async function "${funcName[1]}" may throw unhandled promise rejections`,
            'Wrap the function body in try/catch or add .catch() handler',
          ),
        )
      }
    }
  }

  const arrowAsync = findPattern(content, /\bconst\s+\w+\s*=\s*async\s*\(/g)
  for (const m of arrowAsync) {
    const segment = content.substring(
      Math.max(0, m.index - 50),
      Math.min(content.length, m.index + 500),
    )
    const bodyStart = segment.indexOf('=>')
    if (bodyStart === -1) continue
    const body = segment.substring(bodyStart)
    if (body.includes('try') && body.includes('catch')) continue

    if (!content.includes('.catch(')) {
      const funcName = m.match.match(/const\s+(\w+)/)?.[1]
      if (funcName && !funcName.startsWith('_') && !funcName.startsWith('handle')) {
        findings.push(
          makeFinding(
            relPath,
            m.line,
            'medium',
            'error-handling',
            `Async arrow function "${funcName}" has no try/catch`,
            `Async arrow function may throw unhandled promise rejections`,
            'Wrap the function body in try/catch',
          ),
        )
      }
    }
  }

  return findings
}

function checkMissingReturnTypes(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  const exportFuncs = findPattern(
    content,
    /export\s+(async\s+)?function\s+\w+\s*\([^{]*\{/g,
  )

  for (const m of exportFuncs) {
    const funcDecl = content.substring(m.index, m.index + 100)
    if (!/\)\s*:\s*\w/.test(funcDecl)) {
      const funcName = funcDecl.match(/function\s+(\w+)/)?.[1]
      if (funcName && funcName !== 'default') {
        findings.push(
          makeFinding(
            relPath,
            m.line,
            'info',
            'typescript',
            `Exported function "${funcName}" has no explicit return type`,
            'Missing return type annotation on exported function',
            `Add return type: function ${funcName}(...): ReturnType { ... }`,
          ),
        )
      }
    }
  }

  return findings
}

function checkLooseEquality(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  const nullCompares = findPattern(content, /[=!]==\s*null/g)
  for (const m of nullCompares) {
    const line = content.split('\n')[m.line - 1]
    if (line && !line.trim().startsWith('//')) {
      findings.push(
        makeFinding(
          relPath,
          m.line,
          'info',
          'typescript',
          'Comparison with null',
          'Comparing with == null checks both null and undefined',
          'Use === null or === undefined for explicit checks',
          m.match,
          m.column,
        ),
      )
    }
  }

  return findings
}

function checkLargeImports(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  const imports = findPattern(
    content,
    /import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"]/g,
  )

  for (const m of imports) {
    const namedImports = m.match.match(/\{\s*([^}]+)\s*\}/)
    if (namedImports) {
      const names = namedImports[1]!.split(',').map(s => s.trim()).filter(Boolean)
      if (names.length > 10) {
        findings.push(
          makeFinding(
            relPath,
            m.line,
            'info',
            'best-practice',
            `Large named import (${names.length} imports)`,
            `Import statement has ${names.length} named imports which hurts readability`,
            'Consider using namespace import: import * as Module from "..."',
            m.match.substring(0, 60),
            m.column,
          ),
        )
      }
    }
  }

  return findings
}

function checkAnyTypes(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  const anyMatches = findPattern(content, /\bas\s+any\b/g)
  for (const m of anyMatches) {
    const line = content.split('\n')[m.line - 1]
    if (line && !line.trim().startsWith('//') && !line.includes('@ts-expect-error')) {
      findings.push(
        makeFinding(
          relPath,
          m.line,
          'medium',
          'typescript',
          'as any type assertion',
          'as any bypasses all TypeScript type checking',
          'Use proper type casting or narrow the type with a guard',
          'as any',
          m.column,
        ),
      )
    }
  }

  return findings
}
