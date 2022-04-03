import { formatString, getSchemaType } from "helpers"
import { Schemas } from "types"

export function generateSchemasImports(schemas: Schemas) {
  const imports: string[] = []
  imports.push(...Object.keys(schemas).map(formatString))
  return `import {\n${imports.map(i => "\tSchema" + i).join(",\n")}\n} from "./schemas"`
}

function generateSchemas(schemas: Schemas) {
  const lines: string[] = []
  for (const schemaName in schemas) {
    const schema = schemas[schemaName]
    lines.push(`\n`)
    lines.push(`export interface Schema${formatString(schemaName)} {\n`)

    for (const propertyName in schema.properties) {
      const property = getSchemaType(schema.properties[propertyName])
      lines.push(`\t${propertyName}: ${property}`)
      lines.push(`\n`)
    }

    lines.push(`}\n`)
  }
  return lines.join("")
}

export default generateSchemas