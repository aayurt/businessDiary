export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type FindingCategory =
  | 'db-schema-mismatch'
  | 'missing-validation'
  | 'error-handling'
  | 'security'
  | 'auth'
  | 'component'
  | 'typescript'
  | 'configuration'
  | 'performance'
  | 'best-practice'
  | 'edge-case'

export interface Finding {
  file: string
  line: number
  column?: number
  severity: FindingSeverity
  category: FindingCategory
  title: string
  message: string
  suggestedFix?: string
  code?: string
  scannerName?: string
}

export interface ScannerConfig {
  name: string
  enabled: boolean
  options?: Record<string, unknown>
}

export interface ScanContext {
  rootDir: string
  files: string[]
  schemaPath: string
  prismaModels: string[]
  envVars: Record<string, string>
  sourceContents: Map<string, string>
}

export interface Scanner {
  name: string
  scan: (context: ScanContext) => Finding[]
}

export interface AuditReport {
  generatedAt: string
  durationMs: number
  scannedFiles: number
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  byCategory: Record<string, Finding[]>
  findings: Finding[]
}
