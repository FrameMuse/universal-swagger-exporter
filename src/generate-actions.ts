import _ from "lodash"

import { getSchemaType, joinArgs, reduceParameters } from "./helpers"
import { PathArgs, Paths, RequestMethod, SchemaType } from "./types"

interface RequestAction {
  /**
   * Origin path.
   *
   * @example
   * "/user/coins"
   */
  path: string
  /**
   * Path name transformed to `camelCase`.
   *
   * @example
   * "userCoins"
   */
  name: string
  method: RequestMethod
  description: string

  args: PathArgs
  queryParams: PathArgs

  requestBodyType: SchemaType | undefined
  responseBodyType: SchemaType | undefined

  /**
   * @default
   * "json"
   */
  contentType?: "formData" | "json"
  summary?: string
  operationId?: string
}

export type RequestActionBuilder = (requestAction: RequestAction) => string

function parsePathsToRequestActions(paths: Paths) {
  const refinedPaths: RequestAction[] = []

  for (const path in paths) {
    const pathMethods = paths[path]
    for (const pathMethod in pathMethods) {
      const pathContent = pathMethods[pathMethod]
      const pathContentParameters = pathContent.parameters || []
      const pathContentRequestBody = pathContent.requestBody
      const pathContentResponseCodes = Object.keys(pathContent.responses)

      const getRequestBody = () => {
        if (pathContentRequestBody == null) return

        const content = pathContentRequestBody.content

        const requestBodyAny = Object.keys(content).find(key => !key.includes("json"))
        const requestBodyJson = Object.keys(content).find(key => key.includes("json"))

        if (requestBodyJson) {
          return content[requestBodyJson]
        }

        if (requestBodyAny) {
          return content[requestBodyAny]
        }
      }

      const getContentType = (): "formData" | "json" | undefined => {
        if (pathContentRequestBody == null) return

        const content = pathContentRequestBody.content

        const requestBodyJson = Object.keys(content).find(key => key.includes("json"))
        const requestBodyFormData = Object.keys(content).find(key => key.includes("form"))

        if (requestBodyJson) {
          return "json"
        }

        if (requestBodyFormData) {
          return "formData"
        }
      }

      const requestBody = getRequestBody()
      const requestBodyType = requestBody && getSchemaType(requestBody.schema)

      const contentType = getContentType()

      const args: PathArgs = reduceParameters(pathContentParameters)
      const queryParams = reduceParameters(pathContentParameters.filter(param => param.in === "query"))
      const name = path
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

      const responseBodyScheme = (okContent && okContent["application/json"].schema) || (okContentFallback && okContentFallback.schema)
      const responseBodyType = responseBodyScheme && getSchemaType(responseBodyScheme)

      const description = pathContent.description || (pathContent.responses[okCode || ""]?.description) || ""

      refinedPaths.push({
        description,

        path,
        name,
        method: _.upperCase(pathMethod) as RequestMethod,

        args,
        queryParams: queryParams,
        requestBodyType,
        responseBodyType,

        contentType,
        operationId: pathContent.operationId,
        summary: pathContent.summary,
      })
    }
  }

  return refinedPaths
}

function defaultRequestActionBuilder(requestAction: RequestAction): string {
  const lines: string[] = []


  const argsString = joinArgs(requestAction.args)
  const queryParamKeys = Object.keys(requestAction.queryParams)
  const queryParamsString = queryParamKeys.join(", ")
  const queryParamDescriptions =
    Object
      .entries(requestAction.queryParams)
      .map(([key, value]) => value.description ? ` * @param ${key} - ${value.description} \n` : "")
  const requestBody = requestAction.method === "PATCH" ? `Partial<${requestAction.requestBodyType}>` : requestAction.requestBodyType

  const returnType = requestAction.responseBodyType ? `Action<${requestAction.responseBodyType}>` : "Action"

  if (queryParamDescriptions.length > 0 || requestAction.description.length > 0) {
    lines.push(`/**\n`)
    lines.push(...requestAction.description.split("\n").map(chunk => ` * ${chunk}\n`))
    lines.push(...queryParamDescriptions)
    lines.push(` */\n`)
  }
  lines.push(`export const ${_.camelCase(requestAction.method + requestAction.name)} = (${argsString}${requestAction.requestBodyType ? `${argsString.length ? ", " : ""}body: ${requestBody}` : ""}): ${returnType} => ({\n`)
  lines.push(`  method: "${requestAction.method.toUpperCase()}",\n`)
  lines.push(`  endpoint: \`${requestAction.path.replace(/{/g, "${")}\``)
  if (queryParamsString.length > 0) {
    lines.push(`,\n  params: { ${queryParamsString} }`)
  }
  if (requestAction.requestBodyType) {
    lines.push(`,\n  body`)
  }
  if (requestAction.contentType && requestAction.contentType !== "json") {
    lines.push(`,\n  contentType: "${requestAction.contentType}"`)
  }
  if (requestAction.operationId) {
    lines.push(`,\n  operationId: "${requestAction.operationId}"`)
  }
  lines.push(`\n})`)


  return lines.join("")
}

function generateActions(paths: Paths, buildRequestAction: RequestActionBuilder = defaultRequestActionBuilder): string {
  const requestActions = parsePathsToRequestActions(paths)
  const requestActionsBuilt = requestActions.map(buildRequestAction)
  const requestActionsJoined = requestActionsBuilt.join("\n\n")

  return requestActionsJoined
}

export default generateActions
