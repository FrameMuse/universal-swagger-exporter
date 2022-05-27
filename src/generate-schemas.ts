import { formatString, getSchemaType, reduceProperties } from "helpers"
import { Schemas } from "types"

export function generateSchemasImports(schemas: Schemas) {
  const imports: string[] = []
  imports.push(...Object.keys(schemas).map(formatString))
  return `import {\n${imports.map(i => "  Schema" + i).join(",\n")}\n} from "./schemas"`
}

function generateSchemas(schemas: Schemas) {
  const lines: string[] = []
  for (const schemaName in schemas) {
    const schema = schemas[schemaName]
    const schemaNameFormatted = formatString(schemaName)
    lines.push(`\n`)

    switch (schema.type) {
      case "object":
        lines.push(`export interface Schema${schemaNameFormatted}`)
        lines.push(` `)
        lines.push(reduceProperties(schema.properties, schema.required))
        break

      default:
        lines.push(`export type Schema${schemaNameFormatted} = ${getSchemaType(schema)}`)
        break
    }

    lines.push(`\n`)
  }
  return lines.join("")
}

export default generateSchemas