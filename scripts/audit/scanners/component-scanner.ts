import { Scanner, Finding } from '../types'
import { findPattern, makeFinding, relativePath } from '../scanner-utils'

const MAX_FILE_SIZE = 50_000
const CLIENT_HOOKS = new Set([
  'useState',
  'useEffect',
  'useReducer',
  'useContext',
  'useCallback',
  'useMemo',
  'useRef',
  'useRouter',
  'useSearchParams',
  'usePathname',
  'useSession',
  'useFormState',
  'useFormStatus',
  'useOptimistic',
])

export const componentScanner: Scanner = {
  name: 'React Component Scanner',

  scan(context): Finding[] {
    const findings: Finding[] = []
    const { rootDir, sourceContents } = context

    for (const [filePath, content] of sourceContents) {
      if (content.length > MAX_FILE_SIZE) continue
      if (!filePath.endsWith('.tsx')) continue

      const relPath = relativePath(rootDir, filePath)
      const isClientComponent =
        content.includes('"use client"') || content.includes("'use client'")
      const isServerComponent = !isClientComponent

      if (isClientComponent) {
        findings.push(
          ...checkClientDirectives(content, relPath),
        )
      }

      if (isServerComponent) {
        findings.push(
          ...checkClientHooksInServer(content, relPath),
          ...checkEventHandlersInServer(content, relPath),
        )
      }

      findings.push(...checkMissingKeyProps(content, relPath))
      findings.push(...checkEmptyHookDeps(content, relPath))
      findings.push(...checkFormSubmit(content, relPath))
      findings.push(...checkDynamicImportSSR(content, relPath))
    }

    return findings
  },
}

function checkClientDirectives(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  if (content.includes('"use server"') || content.includes("'use server'")) {
    if (content.includes('"use client"') || content.includes("'use client'")) {
      findings.push(
        makeFinding(
          relPath,
          1,
          'critical',
          'component',
          'Conflicting use client and use server directives',
          'File has both "use client" and "use server" directives',
          'Remove one of the directives. Server actions should be in separate files.',
        ),
      )
    }
  }

  return findings
}

function checkClientHooksInServer(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue

    for (const hook of CLIENT_HOOKS) {
      const regex = new RegExp(`\\b${hook}\\s*\\(`)
      if (regex.test(line)) {
        findings.push(
          makeFinding(
            relPath,
            i + 1,
            'critical',
            'component',
            `Client hook "${hook}" in server component`,
            `Server component uses client hook "${hook}" without "use client" directive`,
            `Add "use client" directive at the top of the file, or move this component to a separate client component`,
            `${hook}(`,
            line.indexOf(hook) + 1,
          ),
        )
      }
    }
  }

  return findings
}

function checkEventHandlersInServer(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []
  const lines = content.split('\n')
  const serverActionPattern = /\bonClick|\bonSubmit|\bonChange|\bonKeyDown|\bonFocus|\nonBlur/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (line.trim().startsWith('//')) continue
    if (line.includes('"use server"') || line.includes("'use server'")) break

    if (serverActionPattern.test(line)) {
      if (!line.includes('action={') && !line.includes('action=')) {
        findings.push(
          makeFinding(
            relPath,
            i + 1,
            'high',
            'component',
            'Event handler in server component',
            'Server components cannot use event handlers like onClick',
            `Add "use client" directive or move interactive logic to a client component`,
            line.trim().substring(0, 40),
          ),
        )
      }
    }
  }

  return findings
}

function checkMissingKeyProps(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (line.trim().startsWith('//')) continue

    if (line.includes('.map(') && !line.includes('key=')) {
      const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join('\n')
      if (!nextLines.includes('key=') && !line.includes('.keys()') && !line.includes('.values()')) {
        findings.push(
          makeFinding(
            relPath,
            i + 1,
            'high',
            'component',
            'Potential missing key prop in .map()',
            '.map() iteration may be missing required key prop',
            'Add key={item.id} to the mapped element for proper React reconciliation',
          ),
        )
      }
    }
  }

  return findings
}

function checkEmptyHookDeps(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  const emptyDepCalls = findPattern(
    content,
    /useEffect\s*\(\s*\([^)]*\)\s*=>\s*\{[^}]*\}[^)]*\[\]\s*\)/g,
  )

  for (const m of emptyDepCalls) {
    const callContent = content.substring(m.index, m.index + m.match.length)
    if (!callContent.includes('// mounted') && !callContent.includes('// once')) {
      findings.push(
        makeFinding(
          relPath,
          m.line,
          'medium',
          'performance',
          'useEffect with empty deps (runs once)',
          'useEffect with empty dependency array may indicate missing dependencies',
          'Add necessary dependencies or add eslint-disable comment if intentional',
          m.match.substring(0, 60),
          m.column,
        ),
      )
    }
  }

  return findings
}

function checkFormSubmit(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (line.includes('onSubmit') && line.includes('{') && !line.includes('preventDefault')) {
      if (
        !content.includes('e.preventDefault') &&
        !content.includes('event.preventDefault')
      ) {
        findings.push(
          makeFinding(
            relPath,
            i + 1,
            'high',
            'component',
            'Form onSubmit missing preventDefault',
            'Form submission handler may cause page reload',
            'Add e.preventDefault() at the start of your submit handler',
            line.trim().substring(0, 50),
          ),
        )
      }
    }
  }

  return findings
}

function checkDynamicImportSSR(
  content: string,
  relPath: string,
): Finding[] {
  const findings: Finding[] = []

  const dynamicImports = findPattern(
    content,
    /dynamic\s*\(\s*\(\)\s*=>\s*import/g,
  )
  for (const m of dynamicImports) {
    const segment = content.substring(m.index, m.index + 200)
    if (!segment.includes('ssr: false')) {
      findings.push(
        makeFinding(
          relPath,
          m.line,
          'info',
          'performance',
          'Dynamic import without ssr: false',
          'Dynamic import may cause hydration issues if component uses browser APIs',
          'Add { ssr: false } to dynamic import: dynamic(() => import(...), { ssr: false })',
          m.match,
          m.column,
        ),
      )
    }
  }

  return findings
}
