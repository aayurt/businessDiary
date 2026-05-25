import { Scanner, Finding } from '../types'
import { findPattern, findBestMatch, makeFinding, relativePath } from '../scanner-utils'

const MAX_FILE_SIZE = 50_000

export const dbScanner: Scanner = {
  name: 'Database Schema Scanner',

  scan(context): Finding[] {
    const findings: Finding[] = []
    const { rootDir, prismaModels, sourceContents } = context

    const pascalModels = new Set(prismaModels)
    const camelModels = new Set(
      prismaModels.map(m => m.charAt(0).toLowerCase() + m.slice(1)),
    )
    const lowerModels = new Set(prismaModels.map(m => m.toLowerCase()))

    for (const [filePath, content] of sourceContents) {
      if (content.length > MAX_FILE_SIZE) continue
      if (!content.includes('db.') && !content.includes('prisma.')) continue

      const relPath = relativePath(rootDir, filePath)
      const modelCalls = findPattern(content, /db\.(\w+)/g)

      for (const m of modelCalls) {
        const modelName = m.match.replace('db.', '')
        if (!modelName || ['$', '_'].some(p => modelName.startsWith(p))) continue
        if (
          pascalModels.has(modelName) ||
          camelModels.has(modelName) ||
          lowerModels.has(modelName)
        ) {
          continue
        }

        const modelStart = m.index
        const afterModel = content.substring(modelStart)
        const hasMethodCall = /^db\.\w+\.\w+\s*\(/.test(afterModel)

        if (!hasMethodCall) continue

        if (modelName === 'post' && prismaModels.includes('MdFile')) {
          findings.push(
            makeFinding(
              relPath,
              m.line,
              'critical',
              'db-schema-mismatch',
              `Non-existent model: db.post`,
              `"db.post" not in Prisma schema. Did you mean "db.mdFile"?`,
              `Replace with db.mdFile`,
              `db.post`,
              m.column,
            ),
          )
          continue
        }

        const suggestion = findBestMatch(modelName, prismaModels)

        if (
          hasMethodCall ||
          /^db\.\w+\.(findUnique|findFirst|findMany|create|update|upsert|delete|count|aggregate)/.test(
            afterModel,
          )
        ) {
          findings.push(
            makeFinding(
              relPath,
              m.line,
              'critical',
              'db-schema-mismatch',
              `Non-existent model: db.${modelName}`,
              `"db.${modelName}" not in Prisma schema. Models: ${prismaModels.join(', ')}`,
              suggestion
                ? `Did you mean db.${suggestion.camel}?`
                : `Verify model name`,
              `db.${modelName}`,
              m.column,
            ),
          )
        }
      }
    }

    return findings
  },
}
