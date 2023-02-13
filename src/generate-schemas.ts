import { formatString, getSchemaType, reduceProperties } from "helpers"
import { Schemas } from "types"

export function generateSchemasImports(schemas: Schemas) {
  const imports: string[] = []
  imports.push(...Object.keys(schemas).map(formatString))
  return `import {\n${imports.map(i => "  " + i).sort().join(",\n")}\n} from "./schemas"`
}

function generateSchemas(schemas: Schemas) {
  const lines: string[] = []
  lines.push(`import { z } from "zod"`)
  lines.push(`\n`)
  for (const schemaName in schemas) {
    const schema = schemas[schemaName]
    const schemaNameFormatted = formatString(schemaName)
    lines.push(`\n`)

    switch (schema.type) {
      case "object":
        lines.push(`/**`)
        lines.push(` * ### [Reference]()`)
        lines.push(` */`)
        lines.push(`export var ${schemaNameFormatted} = z.object(`)
        // lines.push(` `)
        lines.push(reduceProperties(schema.properties, schema.required))
        lines.push(`)`)
        break

      default:
        lines.push(`export var ${schemaNameFormatted} = ${getSchemaType(schema)}`)
        break
    }

    lines.push(`\n`)
  }
  return lines.join("")
}

export default generateSchemas
