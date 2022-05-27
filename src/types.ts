export type Primitive = "string" | "integer" | "number" | "boolean" | "array" | "object"
// export type Schema = (
//   | { type: Exclude<Primitive, "array" | "object">, default?: Primitive }
//   | { type: "array", items: Schema }
//   | { type: "object", $ref?: string, required?: string[], properties?: Record<string, Schema> }
//   | { type: undefined, $ref: string }) & { nullable?: boolean, allOf?: Schema[], enum?: string[] }

interface SchemaArray {
  type: "array"
  /**
   * Items that are represented by this `array`.
   */
  items?: Schema
  /**
   * Means that the value of the `Schema` may be `null`.
   */
  nullable?: boolean
}

interface SchemaObject {
  type: "object"
  properties?: Record<string, Schema>
  /**
   * List of required fields related to `properties` field.
   * @example ["field1", "field2"]
   */
  required?: string[]
  /**
   * Means that the value of the `Schema` may be `null`.
   */
  nullable?: boolean
}

interface SchemaAny {
  /**
   * Type of the `Schema`.
   */
  type?: Exclude<Primitive, "array" | "object">
  /**
   * Default value of the `Schema`.
   */
  default?: Primitive
  /**
   * Reference to another `Schema`.
   * 
   * @example "#/components/schemas/SchemaName"
   */
  $ref?: string
  /**
   * Means that the value of the `Schema` may be `null`.
   */
  nullable?: boolean
  /**
   * Represents union of possible `string` values.
   * It means that the `Schema` has `string` type.
   * The unions are joined by `|` sign.
   * 
   * @example "guest" | "user"
   */
  enum?: string[]
  /**
   * Represents union of possible values.
   * The unions are joined by `&` sign.
   * 
   * @example { foo: string } & { bar: number[] }
   * @example SchemaName1 & SchemaName2
   */
  allOf?: Schema[]
}

export type Schema = SchemaArray | SchemaObject | SchemaAny

export interface Parameter {
  name: string
  in: "path" | "query"
  required?: boolean
  style?: "simple" | "form"
  explode?: boolean
  schema: Schema
  description?: string
}

export type PathMethod = Record<string, {
  description?: string
  parameters?: Parameter[]
  requestBody?: {
    content: {
      [k in string]: { schema: Schema }
    }
  }
  responses: Record<string, {
    content?: {
      [k in string]: { schema: Schema }
    }
    description?: string
  }>
}>

export type Paths = Record<string, PathMethod>
export type Schemas = Record<string, Schema>

export type ActionArgs = Record<string, Omit<Parameter, "required" | "schema"> & { required: boolean, schemaType: string }>