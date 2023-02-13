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
          return "z.unknown().array()"
        }
        if ("properties" in schema.items) {
          return getSchemaType({ ...schema.items, type: "object" }) + ".array()"
        }
        return getSchemaType(schema.items) + ".array()"
      }

      case "object": {
        if (schema.properties == null) {
          return "Record<keyof never, unknown>"
        }
        return `z.object(${reduceProperties(schema.properties, schema.required)})`
      }

      default: {
        if (schema.type) {
          return `z.${schema.type.replace("integer", "number")}()`
        }
        // If has allOf, this is a intersection `&`
        if (schema.allOf) {
          return schema.allOf.map(getSchemaType).map(addParens).join(".and")
        }
        // If has anyOf, this is union `|`
        if (schema.anyOf) {
          return schema.anyOf.map(getSchemaType).map(addParens).join(".or")
        }
        // If has oneOf, this is union `|`
        if (schema.oneOf) {
          return schema.oneOf.map(getSchemaType).map(addParens).join(".or")
        }
        // If has enum, this is a string
        if (schema.enum) {
          return `z.enum("${schema.enum.join(`", "`)}")`
        }
        return deRefSchemaType(schema.$ref)
      }
    }
  }
  const schemaType = getType()
  // Post processing
  if (schema.nullable) {
    return `${schemaType}.nullable()`
  }
  return schemaType
}

export function reduceProperties(props?: Record<string, Schema>, required?: string[]): string {
  if (props == null) return "{ }"

  const propsString = Object.keys(props).map(prop => {
    const optionalMarker = required ? (!required.includes(prop) ? ".optional()" : "") : ""

    return `  ${prop}: ${getSchemaType(props[prop])}` + optionalMarker
  }, "")
  return `{\n${propsString.join(",\n")}\n}`
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

function addParens(value: string, index: number) {
  if (index === 0) return value

  return `(${value})`
}
