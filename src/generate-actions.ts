import { deRefSchema, getSchemaType } from "./helpers"
import { ActionArgs, Parameter, Paths, Schema, Schemas } from "./types"

function reduceBody(body: Record<string, Schema>) {
  return Object.keys(body).reduce((result, key) => ({ ...result, [key]: { required: true, schemaType: getSchemaType(body[key]) } }), {} as ActionArgs)
}
function reduceParameters(parameters: Parameter[]) {
  return parameters.reduce((result, next) => ({ ...result, [next.name]: { required: next.required, schemaType: getSchemaType(next.schema) } }), {} as ActionArgs)
}

function generateActions(paths: Paths, schemas: Schemas) {
  const lines: string[] = []
  for (const path in paths) {
    const pathMethods = paths[path]
    for (const pathMethod in pathMethods) {
      const pathContent = pathMethods[pathMethod]
      const pathContentParameters = pathContent.parameters || []
      const pathContentRequestBody = pathContent.requestBody
      const pathContentResponseCodes = Object.keys(pathContent.responses)

      const requestBody = deRefSchema(schemas, pathContentRequestBody?.content["multipart/form-data"].schema.$ref)
      const requestBodyString = Object.keys(requestBody).join(", ")

      const args: ActionArgs = { ...reduceParameters(pathContentParameters), ...reduceBody(requestBody) }
      const argsString = Object.keys(args).map(arg => `${arg}${args[arg].required ? "" : "?"}: ${args[arg].schemaType}`).join(", ")

      const params = reduceParameters(pathContentParameters.filter(param => param.in === "query"))
      const paramsString = Object.keys(params).join(", ")

      const action = path
        .replace(/{/g, "By/")
        .replace(/}/g, "")
        .replace(/\/(\w)/g, (_, g) => String(g).toUpperCase())
        .replace(/\//g, "")
        .replace(/_(\w)/g, (_, g) => String(g).toUpperCase())

      const okCode = pathContentResponseCodes.find(code => Number(code) >= 200 && Number(code) < 300)
      const payload = okCode && getSchemaType(pathContent.responses[okCode].content["application/json"].schema)
      const returnType = payload ? `Action<${payload}>` : "Action"

      lines.push(`\n`)
      lines.push(`export const ${pathMethod}${action} = (${argsString}): ${returnType} => ({\n`)
      lines.push(`\tmethod: "${pathMethod}",\n`)
      lines.push(`\tendpoint: \`${path.replace(/{/g, "${")}\``)
      if (paramsString.length > 0) {
        lines.push(`,\n\tparams: { ${paramsString} }`)
      }
      if (requestBodyString.length > 0) {
        lines.push(`,\n\tbody: { ${requestBodyString} }`)
      }
      lines.push(`\n})\n`)
    }
  }
  return lines.join("")
}

export default generateActions