import { deRefSchema, getSchemaType } from "./helpers"
import { ActionArgs, Parameter, Paths, Schema, Schemas } from "./types"

function reduceBody(body: Record<string, Schema>) {
  return "{ " + joinArgs(Object.keys(body).reduce((result, key) => ({ ...result, [key]: { required: true, schemaType: getSchemaType(body[key]) } }), {})) + " }"
}
function reduceParameters(parameters: Parameter[]) {
  return parameters.reduce((result, next) => ({ ...result, [next.name]: { required: next.required, schemaType: getSchemaType(next.schema) } }), {} as ActionArgs)
}

function joinArgs(args: ActionArgs) {
  return Object.keys(args).map(arg => `${arg}${args[arg].required ? "" : "?"}: ${args[arg].schemaType}`).join(", ")
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

      const args: ActionArgs = { ...reduceParameters(pathContentParameters), body: { required: true, schemaType: reduceBody(requestBody) } }
      if (requestBodyString.length === 0) delete args.body
      const argsString = joinArgs(args)

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
      lines.push(`  method: "${pathMethod.toUpperCase()}",\n`)
      lines.push(`  endpoint: \`${path.replace(/{/g, "${")}\``)
      if (paramsString.length > 0) {
        lines.push(`,\n  params: { ${paramsString} }`)
      }
      if (requestBodyString.length > 0) {
        lines.push(`,\n  body`)
      }
      lines.push(`\n})\n`)
    }
  }
  return lines.join("")
}

export default generateActions