import { RequestAction } from "generate-actions"
import _ from "lodash"

import { joinArgs } from "../helpers"

function defaultRequestActionBuilder(requestAction: RequestAction): string {
  const lines: string[] = []


  const argsString = joinArgs(requestAction.args)
  const queryParamKeys = Object.keys(requestAction.queryParams)
  const queryParamsString = queryParamKeys.join(", ")
  const queryParamDescriptions =
    Object
      .entries(requestAction.queryParams)
      .map(([key, value]) => value.description ? ` * @param ${key} - ${value.description} \n` : "")

  function getRequestBody(): string | undefined {
    if (requestAction.contentType === "formData") {
      return "FormData"
    }

    if (requestAction.method === "PATCH") {
      return `Partial<${requestAction.requestBodyType}>`
    }

    return requestAction.requestBodyType
  }

  const requestBody = getRequestBody()

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

export default defaultRequestActionBuilder
