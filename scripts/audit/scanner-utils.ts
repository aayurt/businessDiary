import * as fs from 'fs'
import * as path from 'path'
import { Finding, FindingSeverity, FindingCategory, ScanContext } from './types'

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.next',
  '.turbo',
  'dist',
  'build',
  '.git',
  'generated',
])
export function readFile(fp: string): string {
  try {
    return fs.readFileSync(fp, 'utf-8')
  } catch {
    return ''
  }
}

export function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length
}

export function getColumnNumber(content: string, index: number): number {
  const lastNewline = content.lastIndexOf('\n', index - 1)
  return index - lastNewline
}

export function extractLinesAround(
  content: string,
  line: number,
  context: number = 2,
): string {
  const lines = content.split('\n')
  const start = Math.max(0, line - 1 - context)
  const end = Math.min(lines.length, line + context)
  return lines
    .slice(start, end)
    .map((l, i) => {
      const lineNum = start + i + 1
      const prefix = lineNum === line ? '> ' : '  '
      return `${prefix}${lineNum}: ${l}`
    })
    .join('\n')
}

export function findPattern(
  content: string,
  regex: RegExp,
): Array<{ match: string; index: number; line: number; column: number }> {
  const results: Array<{
    match: string
    index: number
    line: number
    column: number
  }> = []
  let m: RegExpExecArray | null
  while ((m = regex.exec(content)) !== null) {
    results.push({
      match: m[0],
      index: m.index,
      line: getLineNumber(content, m.index),
      column: getColumnNumber(content, m.index),
    })
  }
  return results
}

export function tsFiles(rootDir: string, baseDir?: string): string[] {
  const dir = baseDir || path.join(rootDir, 'src')
  const files: string[] = []
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && !EXCLUDED_DIRS.has(entry.name)) {
          files.push(...tsFiles(rootDir, full))
        }
      } else if (
        entry.isFile() &&
        /\.(ts|tsx)$/.test(entry.name) &&
        !full.includes('/generated/')
      ) {
        files.push(full)
      }
    }
  } catch {
    // directory doesn't exist or can't be read
  }
  return files
}

export function extractPrismaModels(schemaPath: string): string[] {
  const content = readFile(schemaPath)
  if (!content) return []
  const models: string[] = []
  const modelRegex = /^model\s+(\w+)\s*\{/gm
  let m: RegExpExecArray | null
  while ((m = modelRegex.exec(content)) !== null) {
    if (m[1]) models.push(m[1])
  }
  return models
}

export function findBestMatch(
  input: string,
  models: string[],
): { pascal: string; camel: string } | null {
  const inputLower = input.toLowerCase()
  const inputCamel = input.charAt(0).toLowerCase() + input.slice(1)

  const exactCamel = models.find(
      m => (m.charAt(0).toLowerCase() + m.slice(1)) === inputCamel,
  )
  if (exactCamel)
    return {
      pascal: exactCamel,
      camel: exactCamel.charAt(0).toLowerCase() + exactCamel.slice(1),
    }

  const exactLower = models.find(m => m.toLowerCase() === inputLower)
  if (exactLower)
    return {
      pascal: exactLower,
      camel: exactLower.charAt(0).toLowerCase() + exactLower.slice(1),
    }

  const fuzzy = models.find(
    m =>
      m.toLowerCase().includes(inputLower) ||
      inputLower.includes(m.toLowerCase()),
  )
  if (fuzzy)
    return {
      pascal: fuzzy,
      camel: fuzzy.charAt(0).toLowerCase() + fuzzy.slice(1),
    }

  return null
}

export function makeFinding(
  file: string,
  line: number,
  severity: FindingSeverity,
  category: FindingCategory,
  title: string,
  message: string,
  suggestedFix?: string,
  code?: string,
  column?: number,
): Finding {
  return { file, line, column, severity, category, title, message, suggestedFix, code }
}

export function relativePath(rootDir: string, filePath: string): string {
  return path.relative(rootDir, filePath)
}

export function buildContext(
  rootDir: string,
  schemaPath: string,
): ScanContext {
  const files = tsFiles(rootDir)
  const prismaModels = extractPrismaModels(schemaPath)

  const sourceContents = new Map<string, string>()
  for (const file of files) {
    const content = readFile(file)
    if (content) {
      sourceContents.set(file, content)
    }
  }

  const envVars: Record<string, string> = {}
  const envPaths = [
    path.join(rootDir, '.env'),
    path.join(rootDir, '.env.local'),
    path.join(rootDir, '.env.production'),
  ]
  for (const envPath of envPaths) {
    const content = readFile(envPath)
    if (content) {
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx === -1) continue
        const key = trimmed.slice(0, eqIdx).trim()
        const value = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, '').trim()
        if (key) envVars[key] = value
      }
    }
  }

  return { rootDir, files, schemaPath, prismaModels, envVars, sourceContents }
}
