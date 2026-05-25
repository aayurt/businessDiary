import * as fs from 'fs'
import * as path from 'path'
import { Scanner, Finding } from '../types'
import { readFile, makeFinding } from '../scanner-utils'

export const configScanner: Scanner = {
  name: 'Configuration Scanner',

  scan(context): Finding[] {
    const findings: Finding[] = []
    const { rootDir } = context

    findings.push(...checkPackageJson(rootDir))
    findings.push(...checkTsconfig(rootDir))
    findings.push(...checkGitignore(rootDir))
    findings.push(...checkPrismaSchema(rootDir))
    findings.push(...checkEnvFiles(rootDir))
    findings.push(...checkNextConfig(rootDir))

    return findings
  },
}

function checkPackageJson(rootDir: string): Finding[] {
  const findings: Finding[] = []
  const pkgPath = path.join(rootDir, 'package.json')

  if (!fs.existsSync(pkgPath)) {
    findings.push(
      makeFinding('package.json', 1, 'critical', 'configuration', 'Missing package.json', 'No package.json found in root directory'),
    )
    return findings
  }

  let pkg: Record<string, any>
  try {
    pkg = JSON.parse(readFile(pkgPath))
  } catch {
    findings.push(
      makeFinding('package.json', 1, 'critical', 'configuration', 'Invalid package.json', 'package.json is not valid JSON'),
    )
    return findings
  }

  const scripts = (pkg.scripts as Record<string, string>) || {}

  if (!scripts.test && !scripts['test:run'] && !scripts['test:unit']) {
    findings.push(
      makeFinding('package.json', 1, 'medium', 'configuration', 'No test script', 'No test script defined in package.json', 'Add a test script: "test": "vitest run" or similar'),
    )
  }

  if (!scripts.lint && !scripts['lint:check']) {
    findings.push(
      makeFinding('package.json', 1, 'medium', 'configuration', 'No lint script', 'No lint script defined in package.json', 'Add a lint script: "lint": "eslint ."'),
    )
  }

  if (!scripts.typecheck && !scripts['type-check']) {
    findings.push(
      makeFinding('package.json', 1, 'medium', 'configuration', 'No typecheck script', 'No typecheck script defined', 'Add: "typecheck": "tsc --noEmit"'),
    )
  }

  if (!pkg.engines?.node) {
    findings.push(
      makeFinding('package.json', 1, 'low', 'configuration', 'No Node.js engine constraint', 'package.json does not specify Node.js version requirement', 'Add "engines": { "node": ">=18" }'),
    )
  }

  const deps = { ...(pkg.dependencies as Record<string, string> || {}), ...(pkg.devDependencies as Record<string, string> || {}) }
  for (const [dep, version] of Object.entries(deps)) {
    if (typeof version === 'string' && (version.startsWith('^') || version.startsWith('~'))) {
      const major = version.replace(/^[\^~]/, '').split('.')[0]
      if (major === '0' || major === '1') {
        findings.push(
          makeFinding('package.json', 1, 'info', 'configuration', `Unstable dependency version: ${dep}@${version}`, `${dep} is on a pre-major version (${version}) - API may break on minor updates`, `Consider pinning exact version: "${dep}": "${version.replace(/^[\^~]/, '')}"`),
        )
      }
    }
  }

  return findings
}

function checkTsconfig(rootDir: string): Finding[] {
  const findings: Finding[] = []
  const tsconfigPath = path.join(rootDir, 'tsconfig.json')

  if (!fs.existsSync(tsconfigPath)) {
    findings.push(
      makeFinding('tsconfig.json', 1, 'critical', 'configuration', 'Missing tsconfig.json', 'No tsconfig.json found'),
    )
    return findings
  }

  let tsconfig: Record<string, any>
  try {
    tsconfig = JSON.parse(readFile(tsconfigPath))
  } catch {
    findings.push(
      makeFinding('tsconfig.json', 1, 'critical', 'configuration', 'Invalid tsconfig.json', 'tsconfig.json is not valid JSON'),
    )
    return findings
  }

  const opts = (tsconfig.compilerOptions as Record<string, any>) || {}

  if (opts.strict !== true) {
    findings.push(
      makeFinding('tsconfig.json', 1, 'high', 'configuration', 'strict mode is disabled', 'TypeScript strict mode is not enabled', 'Enable "strict": true in compilerOptions'),
    )
  }

  if (opts.noUncheckedIndexedAccess !== true) {
    findings.push(
      makeFinding('tsconfig.json', 1, 'low', 'configuration', 'noUncheckedIndexedAccess is disabled', 'Array/object access may silently return undefined', 'Enable "noUncheckedIndexedAccess": true'),
    )
  }

  if (opts.noUnusedLocals !== true) {
    findings.push(
      makeFinding('tsconfig.json', 1, 'info', 'configuration', 'noUnusedLocals is disabled', 'Unused variables not flagged by TypeScript', 'Enable "noUnusedLocals": true'),
    )
  }

  if (opts.noUnusedParameters !== true) {
    findings.push(
      makeFinding('tsconfig.json', 1, 'info', 'configuration', 'noUnusedParameters is disabled', 'Unused parameters not flagged by TypeScript', 'Enable "noUnusedParameters": true'),
    )
  }

  return findings
}

function checkGitignore(rootDir: string): Finding[] {
  const findings: Finding[] = []
  const gitignorePath = path.join(rootDir, '.gitignore')

  if (!fs.existsSync(gitignorePath)) {
    findings.push(
      makeFinding('.gitignore', 1, 'medium', 'configuration', 'Missing .gitignore', 'No .gitignore file found'),
    )
    return findings
  }

  const content = readFile(gitignorePath)
  const entries = new Set(content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')))

  const requiredEntries = [
    { pattern: 'node_modules', severity: 'critical' as const, msg: 'node_modules should always be gitignored' },
    { pattern: '.env', severity: 'high' as const, msg: 'Environment files with secrets should be gitignored' },
    { pattern: '.next', severity: 'high' as const, msg: 'Next.js build output should be gitignored' },
    { pattern: 'dist', severity: 'medium' as const, msg: 'Build output directory should be gitignored' },
    { pattern: '.env.local', severity: 'high' as const, msg: 'Local env files with secrets should be gitignored' },
  ]

  for (const { pattern, severity, msg } of requiredEntries) {
    let found = false
    for (const entry of entries) {
      if (entry === pattern || entry === '/' + pattern || entry === pattern + '/' || entry === '/' + pattern + '/') {
        found = true
        break
      }
    }
    if (!found) {
      findings.push(
        makeFinding('.gitignore', 1, severity, 'configuration', `.gitignore missing "${pattern}"`, msg, `Add "${pattern}" to .gitignore`),
      )
    }
  }

  return findings
}

function checkPrismaSchema(rootDir: string): Finding[] {
  const findings: Finding[] = []
  const schemaPaths = [
    path.join(rootDir, 'prisma', 'schema.prisma'),
  ]

  let schemaContent = ''
  for (const sp of schemaPaths) {
    if (fs.existsSync(sp)) {
      schemaContent = readFile(sp)
      break
    }
  }

  if (!schemaContent) {
    findings.push(
      makeFinding('prisma/schema.prisma', 1, 'critical', 'configuration', 'Missing Prisma schema', 'No prisma/schema.prisma found'),
    )
    return findings
  }

  if (!schemaContent.includes('generator')) {
    findings.push(
      makeFinding('prisma/schema.prisma', 1, 'critical', 'configuration', 'Missing Prisma generator', 'Schema has no generator block', 'Add generator client { provider = "prisma-client-js" }'),
    )
  }

  if (!schemaContent.includes('datasource')) {
    findings.push(
      makeFinding('prisma/schema.prisma', 1, 'critical', 'configuration', 'Missing Prisma datasource', 'Schema has no datasource block', 'Add datasource db { provider = "postgresql" }'),
    )
  }

  if (!schemaContent.includes('postgresql') && !schemaContent.includes('postgres')) {
    findings.push(
      makeFinding('prisma/schema.prisma', 1, 'info', 'configuration', 'Non-PostgreSQL datasource', 'Schema uses a non-PostgreSQL provider', 'Consider if PostgreSQL is the right choice for production'),
    )
  }

  const models = schemaContent.match(/^model\s+\w+\s*\{/gm)
  if (!models || models.length === 0) {
    findings.push(
      makeFinding('prisma/schema.prisma', 1, 'high', 'configuration', 'No models defined', 'Prisma schema has no models defined'),
    )
  }

  if (!schemaContent.includes('@updatedAt')) {
    findings.push(
      makeFinding('prisma/schema.prisma', 1, 'low', 'best-practice', 'No @updatedAt fields', 'No fields use @updatedAt attribute', 'Add @updatedAt to timestamp fields that track modification time'),
    )
  }

  return findings
}

function checkEnvFiles(rootDir: string): Finding[] {
  const findings: Finding[] = []

  const envPaths = [
    path.join(rootDir, '.env'),
    path.join(rootDir, '.env.example'),
    path.join(rootDir, '.env.local'),
  ]

  const hasEnv = envPaths.some(ep => fs.existsSync(ep))

  if (!hasEnv) {
    findings.push(
      makeFinding('.env', 1, 'high', 'configuration', 'No .env file', 'No environment configuration file found', 'Create .env file with required environment variables'),
    )
  }

  return findings
}

function checkNextConfig(rootDir: string): Finding[] {
  const findings: Finding[] = []

  const configFiles = [
    'next.config.ts',
    'next.config.mjs',
    'next.config.js',
  ]

  const hasConfig = configFiles.some(cf => fs.existsSync(path.join(rootDir, cf)))

  if (!hasConfig) {
    findings.push(
      makeFinding('next.config.*', 1, 'critical', 'configuration', 'Missing Next.js config', 'No next.config.ts, .mjs, or .js found'),
    )
  }

  return findings
}
