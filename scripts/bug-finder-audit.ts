#!/usr/bin/env tsx
import { AuditReport, FindingCategory, Scanner } from './audit/types'
import { buildContext } from './audit/scanner-utils'
import { generateReport, writeReportFiles } from './audit/reporter'
import { dbScanner } from './audit/scanners/db-scanner'
import { apiScanner } from './audit/scanners/api-scanner'
import { authScanner } from './audit/scanners/auth-scanner'
import { componentScanner } from './audit/scanners/component-scanner'
import { securityScanner } from './audit/scanners/security-scanner'
import { tsScanner } from './audit/scanners/typescript-scanner'
import { configScanner } from './audit/scanners/config-scanner'
import { chaosEdgeScanner } from './audit/scanners/chaos-edge-scanner'
import * as path from 'path'
import * as fs from 'fs'

const AVAILABLE_SCANNERS: Record<string, Scanner> = {
  db: dbScanner,
  api: apiScanner,
  auth: authScanner,
  component: componentScanner,
  security: securityScanner,
  typescript: tsScanner,
  config: configScanner,
  chaos: chaosEdgeScanner,
}

interface CliOptions {
  rootDir: string
  schemaPath: string
  outputDir: string
  format: 'console' | 'json' | 'markdown'
  scannerNames: string[] | 'all'
  color: boolean
  failOnSeverity: string | null
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const opts: CliOptions = {
    rootDir: process.cwd(),
    schemaPath: '',
    outputDir: 'audit-output',
    format: 'console',
    scannerNames: 'all',
    color: true,
    failOnSeverity: null,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dir':
        opts.rootDir = args[++i] || opts.rootDir
        break
      case '--schema':
        opts.schemaPath = args[++i] || ''
        break
      case '--output':
        opts.outputDir = args[++i] || opts.outputDir
        break
      case '--format':
        const f = args[++i] || 'console'
        if (f === 'console' || f === 'json' || f === 'markdown') {
          opts.format = f
        }
        break
      case '--scanners':
        const val = args[++i] || 'all'
        opts.scannerNames = val === 'all' ? 'all' : val.split(',').map(s => s.trim())
        break
      case '--no-color':
        opts.color = false
        break
      case '--fail-on':
        opts.failOnSeverity = args[++i] || null
        break
      case '--list-scanners':
        listScanners()
        process.exit(0)
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
    }
  }

  if (!opts.schemaPath) {
    opts.schemaPath = path.join(opts.rootDir, 'prisma', 'schema.prisma')
  }

  return opts
}

function listScanners(): void {
  console.log('Available scanners:')
  for (const [key, scanner] of Object.entries(AVAILABLE_SCANNERS)) {
    console.log(`  ${key.padEnd(14)} ${scanner.name}`)
  }
}

function printHelp(): void {
  console.log(`
Bug Finder Audit - Chaos agent stress-tester for Builder output

Usage:
  npx tsx scripts/bug-finder-audit.ts [options]

Options:
  --dir <path>       Root directory to scan (default: cwd)
  --schema <path>    Prisma schema path (default: prisma/schema.prisma)
  --output <path>    Output directory for reports (default: audit-output)
  --format <fmt>     Output format: console | json | markdown (default: console)
  --scanners <s>     Comma-separated scanners: ${Object.keys(AVAILABLE_SCANNERS).join(', ')} (default: all)
  --no-color         Disable color output
  --fail-on <sev>    Exit with code 1 if any finding >= severity (critical|high|medium|low|info)
  --list-scanners    List available scanners and exit
  --help, -h         Show this help

Scanners:
${Object.entries(AVAILABLE_SCANNERS).map(([k, v]) => `  ${k.padEnd(14)} ${v.name}`).join('\n')}

Examples:
  npx tsx scripts/bug-finder-audit.ts
  npx tsx scripts/bug-finder-audit.ts --scanners security,chaos
  npx tsx scripts/bug-finder-audit.ts --format json --fail-on high
  `)
}

function getEnabledScanners(names: string[] | 'all'): Scanner[] {
  if (names === 'all') {
    return Object.values(AVAILABLE_SCANNERS)
  }
  return names
    .map(n => AVAILABLE_SCANNERS[n])
    .filter((s): s is Scanner => s !== undefined)
}

function runScanners(context: any, scanners: Scanner[]): any[] {
  const allResults: any[] = []

  for (const scanner of scanners) {
    const start = performance.now()
    let findings: any[] = []
    try {
      findings = scanner.scan(context)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`Scanner "${scanner.name}" failed: ${errorMsg}`)
      findings = [{
        file: 'internal',
        line: 0,
        severity: 'high',
        category: 'best-practice',
        title: `Scanner "${scanner.name}" threw an error`,
        message: errorMsg,
        suggestedFix: 'Check the scanner implementation for bugs.',
      }]
    }
    const duration = performance.now() - start
    for (const f of findings) {
      f.scannerName = scanner.name
    }
    allResults.push({
      scannerName: scanner.name,
      filesScanned: context.files.length,
      findings,
      durationMs: Math.round(duration),
    })
  }

  return allResults
}

function buildReport(context: any, scanResults: any[], durationMs: number): AuditReport {
  const allFindings: any[] = []
  for (const result of scanResults) {
    for (const f of result.findings) {
      allFindings.push(f)
    }
  }

  const categories: FindingCategory[] = [
    'db-schema-mismatch', 'missing-validation', 'error-handling',
    'security', 'auth', 'component', 'typescript', 'configuration',
    'performance', 'best-practice', 'edge-case',
  ]
  const byCategory: Record<string, any[]> = {}
  for (const cat of categories) {
    byCategory[cat] = []
  }

  let critical = 0, high = 0, medium = 0, low = 0, info = 0

  for (const f of allFindings) {
    if (byCategory[f.category]) {
      byCategory[f.category]!.push(f)
    } else {
      (byCategory['best-practice'] ??= []).push(f)
    }
    switch (f.severity) {
      case 'critical': critical++; break
      case 'high': high++; break
      case 'medium': medium++; break
      case 'low': low++; break
      case 'info': info++; break
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    durationMs,
    scannedFiles: context.files.length,
    summary: { total: allFindings.length, critical, high, medium, low, info },
    byCategory,
    findings: allFindings,
  }
}

function shouldFail(report: AuditReport, failOnSeverity: string | null): boolean {
  if (!failOnSeverity) return false
  const ranks: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  const threshold = ranks[failOnSeverity]
  if (threshold === undefined) return false

  for (const f of report.findings) {
    if ((ranks[f.severity] ?? 99) <= threshold) return true
  }
  return false
}

async function main(): Promise<void> {
  const opts = parseArgs()

  if (!fs.existsSync(opts.schemaPath)) {
    console.error(`Warning: Prisma schema not found at ${opts.schemaPath}. DB scanner may not work.`)
    console.error(`Specify with --schema <path>\n`)
  }

  const startTime = performance.now()

  let context: any
  try {
    context = buildContext(opts.rootDir, opts.schemaPath)
  } catch (err) {
    console.error(`Error building scan context: ${err}`)
    process.exit(1)
  }

  if (context.files.length === 0) {
    console.error('No TypeScript files found in src/ directory.')
    process.exit(1)
  }

  const scanners = getEnabledScanners(opts.scannerNames)
  if (scanners.length === 0) {
    console.error('No valid scanners selected. Available:', Object.keys(AVAILABLE_SCANNERS).join(', '))
    process.exit(1)
  }

  console.error(`Scanning ${context.files.length} files with ${scanners.length} scanners...`)

  const scanResults = runScanners(context, scanners)
  const durationMs = Math.round(performance.now() - startTime)

  const report = buildReport(context, scanResults, durationMs)
  const output = generateReport(report, opts.format)

  console.log(output)

  try {
    const files = writeReportFiles(report, opts.outputDir)
    console.error(`\nReports written to:`)
    console.error(`  JSON: ${files.json}`)
    console.error(`  MD:   ${files.md}`)
  } catch (err) {
    console.error(`Warning: Could not write report files: ${err}`)
  }

  if (shouldFail(report, opts.failOnSeverity)) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Bug Finder Audit failed:', err)
  process.exit(1)
})
