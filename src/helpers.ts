import { Schema } from "./types"

export function deRefSchemaType(ref?: string) {
  if (ref == null) return ""
  return ref.replace(/#\/components\/schemas\/(\w+)/, (_, g) => "Schema" + formatString(g))
}
export function getSchemaType(scheme: Schema): string {
  switch (scheme.type) {
    case "array": {
      if (scheme.items.type) {
        return getSchemaType(scheme.items) + "[]"
      }
      return deRefSchemaType(scheme.items.$ref) + "[]"
    }

    case "object": {
      if (scheme.properties) {
        return reduceProperties(scheme.properties, scheme.required)
      }
      if (scheme.$ref) {
        return deRefSchemaType(scheme.$ref)
      }
      return scheme.type
    }

    // @ts-expect-error
    case "string":
      if (scheme.enum) {
        return scheme.enum.map(element => `"${element}"`).join(" | ")
      }
    // Intentional fallthrough
    default: {
      if (scheme.type) {
        return scheme.type.replace("integer", "number")
      }
      return deRefSchemaType(scheme.$ref)
    }
  }
}

export function reduceProperties(props?: Record<string, Schema>, required?: string[]): string {
  if (props == null) return "{ }"

  const propsString = Object.keys(props).map(prop => {
    const optionalSign = required ? (!required.includes(prop) ? "?" : "") : ""
    return `  ${prop}${optionalSign}: ${getSchemaType(props[prop])}`
  }, "")
  return `{\n${propsString.join("\n")}\n}`
}

export function reduceParameters(parameters: Parameter[]): ActionArgs {
  return parameters.reduce((result, next) => ({ ...result, [next.name]: { ...next, required: (next.required ?? (next.in !== "query")), schemaType: getSchemaType(next.schema) } }), {} as ActionArgs)
}

export function joinArgs(args: ActionArgs) {
  return Object.keys(args).map(arg => `${arg}${args[arg].required ? "" : "?"}: ${args[arg].schemaType}`).join(", ")
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