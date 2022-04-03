import { Schema, Schemas } from "./types"

export function deRefSchema(schemas: Schemas, ref?: string) {
  if (ref == null) return {}
  const schema = ref.replace("#/components/schemas/", "")
  return schemas[schema].properties
}
export function deRefSchemaType(ref?: string) {
  if (ref == null) return ""
  return ref.replace(/#\/components\/schemas\/(\w+)/, (_, g) => "Schema" + formatString(g))
}
export function getSchemaType(scheme: Schema) {
  switch (scheme.type) {
    case "array": {
      if (scheme.items.type) {
        return scheme.items.type.replace("integer", "number")
      }
      return deRefSchemaType(scheme.items.$ref) + "[]"
    }

    default: {
      if (scheme.type) {
        return scheme.type.replace("integer", "number")
      }
      return deRefSchemaType(scheme.$ref)
    }
  }
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