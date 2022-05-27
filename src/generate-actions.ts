import { getSchemaType, joinArgs, reduceParameters } from "./helpers"
import { ActionArgs, Paths } from "./types"

function generateActions(paths: Paths) {
  const lines: string[] = []
  for (const path in paths) {
    const pathMethods = paths[path]
    for (const pathMethod in pathMethods) {
      const pathContent = pathMethods[pathMethod]
      const pathContentParameters = pathContent.parameters || []
      const pathContentRequestBody = pathContent.requestBody
      const pathContentResponseCodes = Object.keys(pathContent.responses)

      const requestBody = pathContentRequestBody?.content["multipart/form-data"]
      const requestBodyType = requestBody && getSchemaType(requestBody.schema)

      const args: ActionArgs = reduceParameters(pathContentParameters)
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
      const okContent = okCode ? pathContent.responses[okCode].content : undefined

      const okContentFallbackKey = okContent && Object.keys(okContent).find(key => key.includes("json"))
      const okContentFallback = okContentFallbackKey ? okContent[okContentFallbackKey] : undefined

      const returnScheme = (okContent && okContent["application/json"].schema) || (okContentFallback && okContentFallback.schema)
      const returnType = returnScheme ? `Action<${getSchemaType(returnScheme)}>` : "Action"

      const paramsDescription = Object.keys(params).map(key => {
        const param = params[key]
        if (param.description) {
          return ` * @param ${key} - ${param.description} \n`
        }
        return ""
      })
      const description = pathContent.description || (pathContent.responses[okCode || ""]?.description) || ""

      lines.push(`\n`)
      if (paramsDescription.length > 0 || description.length > 0) {
        lines.push(`/**\n`)
        lines.push(...description.split("\n").map(chunk => ` * ${chunk}\n`))
        lines.push(...paramsDescription)
        lines.push(` */\n`)
      }
      lines.push(`export const ${pathMethod}${action} = (${argsString}${requestBodyType ? `${argsString.length ? ", " : ""}body: ${requestBodyType}` : ""}): ${returnType} => ({\n`)
      lines.push(`  method: "${pathMethod.toUpperCase()}",\n`)
      lines.push(`  endpoint: \`${path.replace(/{/g, "${")}\``)
      if (paramsString.length > 0) {
        lines.push(`,\n  params: { ${paramsString} }`)
      }
      if (requestBodyType) {
        lines.push(`,\n  body`)
      }
      lines.push(`\n})\n`)
    }
  }
  return lines.join("")
}

export default generateActions