import * as fs from 'fs'
import * as path from 'path'
import { AuditReport, Finding } from './types'

const SEVERITY_COLORS: Record<string, string> = {
  critical: '\x1b[31m', // red
  high: '\x1b[33m',     // yellow
  medium: '\x1b[36m',   // cyan
  low: '\x1b[34m',      // blue
  info: '\x1b[90m',     // gray
}

const SEVERITY_EMOJIS: Record<string, string> = {
  critical: '\u{1F525}', // fire
  high: '\u{26A0}\u{FE0F}',    // warning
  medium: '\u{26A1}',    // lightning
  low: '\u{1F4A1}',      // lightbulb
  info: '\u{2139}\u{FE0F}',    // info
}

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'

function severityRank(s: string): number {
  const ranks: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  }
  return ranks[s] ?? 99
}

function formatDuration(ms: number): string {
  if (ms < 1_000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}s`
  const min = Math.floor(ms / 60_000)
  const sec = Math.round((ms % 60_000) / 1_000)
  return `${min}m ${sec}s`
}

export function generateConsoleReport(report: AuditReport): string {
  const lines: string[] = []

  lines.push('')
  lines.push(`${BOLD}BUG FINDER AUDIT REPORT${RESET}`)
  lines.push(`${DIM}${'='.repeat(60)}${RESET}`)
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Duration:  ${formatDuration(report.durationMs)}`)
  lines.push(`Files:     ${report.scannedFiles}`)
  lines.push('')

  const s = report.summary
  const totalColor = s.critical > 0 ? '\x1b[31m' : s.high > 0 ? '\x1b[33m' : '\x1b[32m'
  lines.push(`${BOLD}Summary:${RESET}`)
  lines.push(`  Critical: ${s.critical}`)
  lines.push(`  High:     ${s.high}`)
  lines.push(`  Medium:   ${s.medium}`)
  lines.push(`  Low:      ${s.low}`)
  lines.push(`  Info:     ${s.info}`)
  lines.push(`  ${totalColor}Total:    ${s.total}${RESET}`)
  lines.push('')

  const sorted = [...report.findings].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  )

  if (sorted.length > 0) {
    lines.push(`${BOLD}Findings:${RESET}`)
    lines.push('')

    for (const f of sorted) {
      const color = SEVERITY_COLORS[f.severity] || ''
      const emoji = SEVERITY_EMOJIS[f.severity] || ''
      const sevLabel = f.severity.toUpperCase().padEnd(8)

      lines.push(
        `  ${color}${emoji} ${BOLD}[${sevLabel}]${RESET} ${f.title}`,
      )
      lines.push(`         ${DIM}File:${RESET} ${f.file}:${f.line}${f.column ? `:${f.column}` : ''}`)
      lines.push(`         ${DIM}Cat:${RESET}  ${f.category}`)
      lines.push(`         ${DIM}Msg:${RESET}  ${f.message}`)
      if (f.suggestedFix) {
        lines.push(`         ${DIM}Fix:${RESET}  ${f.suggestedFix}`)
      }
      if (f.code) {
        lines.push(`         ${DIM}Code:${RESET} ${f.code}`)
      }
      lines.push('')
    }

    lines.push(`${DIM}${'.'.repeat(60)}${RESET}`)
    lines.push(`Total: ${sorted.length} findings`)

    const byCat: Record<string, number> = {}
    for (const f of sorted) {
      byCat[f.category] = (byCat[f.category] || 0) + 1
    }
    lines.push('')
    lines.push(`${BOLD}By Category:${RESET}`)
    for (const [cat, count] of Object.entries(byCat).sort(
      (a, b) => b[1] - a[1],
    )) {
      lines.push(`  ${cat}: ${count}`)
    }
  } else {
    lines.push(`${BOLD}No findings.${RESET}`)
  }

  lines.push('')
  return lines.join('\n')
}

export function generateMarkdownReport(report: AuditReport): string {
  const lines: string[] = []

  lines.push('# Bug Finder Audit Report')
  lines.push('')
  lines.push(`- **Generated:** ${report.generatedAt}`)
  lines.push(`- **Duration:** ${formatDuration(report.durationMs)}`)
  lines.push(`- **Files Scanned:** ${report.scannedFiles}`)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push('| Severity | Count |')
  lines.push('|----------|-------|')
  const s = report.summary
  lines.push(`| Critical | ${s.critical} |`)
  lines.push(`| High     | ${s.high} |`)
  lines.push(`| Medium   | ${s.medium} |`)
  lines.push(`| Low      | ${s.low} |`)
  lines.push(`| Info     | ${s.info} |`)
  lines.push(`| **Total** | **${s.total}** |`)
  lines.push('')

  const sorted = [...report.findings].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  )

  if (sorted.length > 0) {
    lines.push('## Findings')
    lines.push('')

    for (const [i, f] of sorted.entries()) {
      const emoji = SEVERITY_EMOJIS[f.severity] || ''
      lines.push(`### ${i + 1}. ${emoji} ${f.title}`)
      lines.push('')
      lines.push('| Property | Value |')
      lines.push('|----------|-------|')
      lines.push(`| **Severity** | ${f.severity.toUpperCase()} |`)
      lines.push(`| **Category** | ${f.category} |`)
      lines.push(`| **File** | \`${f.file}:${f.line}\` |`)
      if (f.column) lines.push(`| **Column** | ${f.column} |`)
      lines.push(`| **Scanner** | ${f.scannerName || 'unknown'} |`)
      lines.push(`| **Message** | ${f.message} |`)
      if (f.suggestedFix) lines.push(`| **Suggested Fix** | ${f.suggestedFix} |`)
      if (f.code) lines.push(`| **Code** | \`${f.code}\` |`)
      lines.push('')
    }

    lines.push('## Findings by Category')
    lines.push('')
    const byCat: Record<string, Finding[]> = {}
    for (const f of sorted) {
      (byCat[f.category] ??= []).push(f)
    }
    for (const [cat, cats] of Object.entries(byCat).sort(
      (a, b) => b[1].length - a[1].length,
    )) {
      const cc = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
      for (const f of cats) cc[f.severity]++
      lines.push(
        `- **${cat}**: ${cats.length} findings ` +
          `(C:${cc.critical}, H:${cc.high}, M:${cc.medium}, L:${cc.low}, I:${cc.info})`,
      )
    }
    lines.push('')
  }

  return lines.join('\n')
}

export function generateReport(
  report: AuditReport,
  format: 'console' | 'json' | 'markdown',
): string {
  switch (format) {
    case 'console':
      return generateConsoleReport(report)
    case 'markdown':
      return generateMarkdownReport(report)
    case 'json':
      return JSON.stringify(report, null, 2)
  }
}

export function writeReportFiles(
  report: AuditReport,
  outputDir: string,
): { json: string; md: string } {
  const jsonPath = path.join(outputDir, 'audit-report.json')
  const mdPath = path.join(outputDir, 'audit-report.md')

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8')

  const mdContent = generateMarkdownReport(report)
  fs.writeFileSync(mdPath, mdContent, 'utf-8')

  return { json: jsonPath, md: mdPath }
}
