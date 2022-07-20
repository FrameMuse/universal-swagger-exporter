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

      const requestBodyFallbackKey = pathContentRequestBody?.content && Object.keys(pathContentRequestBody?.content).find(key => key.includes("json"))
      const requestBodyFallback = requestBodyFallbackKey ? pathContentRequestBody?.content?.[requestBodyFallbackKey] : undefined

      const requestBodyType = (requestBody && getSchemaType(requestBody.schema)) || (requestBodyFallback && getSchemaType(requestBodyFallback.schema))

      const args: ActionArgs = reduceParameters(pathContentParameters)
      const argKeys = Object.keys(args)
      const pageParam = argKeys.includes("page")
      const pageSizeParam = argKeys.includes("page_size")
      const hasPagination = pageParam || pageSizeParam
      if (hasPagination) {
        delete args["page"]
        delete args["page_size"]
      }
      const argsString = joinArgs(args)

      const params = reduceParameters(pathContentParameters.filter(param => param.in === "query"))
      if (hasPagination) {
        delete params["page"]
        delete params["page_size"]
      }
      const paramKeys = Object.keys(params)
      const paramsString = paramKeys.join(", ")


      const action = path
        .replace(/{/g, "/")
        .replace(/}/g, "")
        .replace(/\/(\w)/g, (_, g) => String(g).toUpperCase())
        .replace(/\//g, "")
        .replace(/_(\w)/g, (_, g) => String(g).toUpperCase())



      const okCode = pathContentResponseCodes.find(code => code === "default" || (Number(code) >= 200 && Number(code) < 300))
      const okContent = okCode ? pathContent.responses[okCode].content : undefined

      if (okContent) {
        if (!okContent["application/json"]) {
          console.warn(okCode && pathContent.responses[okCode].content)
          console.warn("The `application/json` type wasn't found, it will be replaced with key")
        }
      }

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

      const body = pathMethod === "patch" ? `Partial<${requestBodyType}>` : requestBodyType
      const description = pathContent.description || (pathContent.responses[okCode || ""]?.description) || ""

      const config: Record<string, unknown> = {}
      if (hasPagination) {
        config["pagination"] = true
      }

      lines.push(`\n`)
      if (paramsDescription.length > 0 || description.length > 0) {
        lines.push(`/**\n`)
        lines.push(...description.split("\n").map(chunk => ` * ${chunk}\n`))
        lines.push(...paramsDescription)
        lines.push(` */\n`)
      }
      lines.push(`export const ${pathMethod}${action} = (${argsString}${requestBodyType ? `${argsString.length ? ", " : ""}body: ${body}` : ""}): ${returnType} => ({\n`)
      lines.push(`  method: "${pathMethod.toUpperCase()}",\n`)
      lines.push(`  endpoint: \`${path.replace(/{/g, "${")}\``)
      if (paramsString.length > 0) {
        lines.push(`,\n  params: { ${paramsString} }`)
      }
      if (requestBodyType) {
        lines.push(`,\n  body`)
      }
      if (Object.keys(config).length > 0) {
        lines.push(`,\n  config: {`)
        lines.push(`\n    ${Object.entries(config).map(([key, value]) => `${key}: ${value}`).join(",\n")}`)
        lines.push(`\n  }`)
      }
      lines.push(`\n})\n`)
    }
  }
  return lines.join("")
}

export default generateActions