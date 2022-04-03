export type Primitive = "string" | "integer" | "number" | "boolean" | "array" | "object"
export type Schema =
  | { type: Exclude<Primitive, "array"> }
  | { type: "array", items: { type?: string, $ref?: string } }
  | { type: undefined, $ref: string }

export interface Parameter {
  name: string
  in: "path" | "query"
  required: boolean
  style: "simple" | "form"
  explode: boolean
  schema: Schema
}

export type PathMethod = Record<string, {
  parameters?: Parameter[]
  requestBody?: {
    content: {
      "multipart/form-data": { schema: { $ref: string } }
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
export type Schemas = Record<string, { type: string, properties: Record<string, Schema> }>

export type ActionArgs = Record<string, { required: boolean, schemaType: string }>