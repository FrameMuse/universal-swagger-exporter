export type Primitive = "string" | "integer" | "number" | "boolean" | "array" | "object"
export type Schema =
  | { type: Exclude<Primitive, "array" | "object">, default?: Primitive, enum?: string[] }
  | { type: "array", items: Schema }
  | { type: "object", $ref?: string, required?: string[], properties?: Record<string, Schema> }
  | { type: undefined, $ref: string }

export interface Parameter {
  name: string
  in: "path" | "query"
  required?: boolean
  style?: "simple" | "form"
  explode?: boolean
  schema: Schema
}

export type PathMethod = Record<string, {
  description?: string
  parameters?: Parameter[]
  requestBody?: {
    content: {
      "multipart/form-data": { schema: Schema }
    }
  }
  responses: Record<string, {
    content: {
      "application/json": {
        schema: Schema
      }
    }
  }>
}>

export type Paths = Record<string, PathMethod>
export type Schemas = Record<string, Schema>

export type ActionArgs = Record<string, { required: boolean, schemaType: string }>