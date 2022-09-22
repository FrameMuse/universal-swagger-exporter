import { Parameter, PathArgs, Schema, SchemaType } from "./types"

export function deRefSchemaType(schemaRef?: string): SchemaType {
  if (schemaRef == null) return ""
  // `#/components/schemas/` has 21 chars
  return formatString(schemaRef.slice(21))
}

export function getSchemaType(schema: Schema): SchemaType {
  function getType() {
    switch (schema.type) {
      case "array": {
        if (schema.items == null) {
          return schema.type
        }
        return getSchemaType(schema.items) + "[]"
      }

      case "object": {
        if (schema.properties == null) {
          return schema.type
        }
        return reduceProperties(schema.properties, schema.required)
      }

      default: {
        if (schema.type) {
          return schema.type.replace("integer", "number")
        }
        // If has allOf, this is a union `&`
        if (schema.allOf) {
          return schema.allOf.map(getSchemaType).join(" & ")
        }
        // If has allOf, this is a ... `|`
        if (schema.anyOf) {
          return schema.anyOf.map(getSchemaType).join(" | ")
        }
        // If has enum, this is a string
        if (schema.enum) {
          return schema.enum.map(element => `"${element}"`).join(" | ")
        }
        return deRefSchemaType(schema.$ref)
      }
    }
  }
  const schemaType = getType()
  // Post processing
  if (schema.nullable) {
    return `${schemaType} | null`
  }
  return schemaType
}

export function reduceProperties(props?: Record<string, Schema>, required?: string[]): string {
  if (props == null) return "{ }"

  const propsString = Object.keys(props).map(prop => {
    const optionalSign = required ? (!required.includes(prop) ? "?" : "") : ""
    return `  ${prop}${optionalSign}: ${getSchemaType(props[prop])}`
  }, "")
  return `{\n${propsString.join("\n")}\n}`
}

export function reduceParameters(parameters: Parameter[]): PathArgs {
  return parameters.reduce((result, next) => ({ ...result, [next.name]: { ...next, required: (next.required ?? (next.in !== "query")), schemaType: getSchemaType(next.schema) } }), {} as PathArgs)
}

export function joinArgs(args: PathArgs) {
  return Object.keys(args).map(arg => `${arg}${args[arg].required ? "" : "?"}: ${args[arg].schemaType}`).sort(a => a.includes("?") ? 0 : -1).join(", ")
}

export function capitalize(string: string) {
  return string[0].toUpperCase() + string.slice(1)
}

export function toCamelCase(string: string) {
  return string.replace(/_(\w)/g, (_, g) => String(g).toUpperCase())
}

export function formatString(string: string) {
  return capitalize(toCamelCase(string))
}