import fs from "fs"
import { Paths, Schemas } from "./types"
import generateActions from "./generate-actions"
import generateSchemas, { generateSchemasImports } from "./generate-schemas"

const dir = "out"
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}

const TestJSON = JSON.parse(fs.readFileSync("data/api.json").toString("utf-8"))

const paths: Paths = TestJSON.paths
const schemas: Schemas = TestJSON.components.schemas

/* Paths */

{
  const file = fs.openSync(dir + "/actions.ts", "w")
  fs.writeSync(file, `import { Action } from "../client.types"`)
  fs.writeSync(file, `\n`)
  fs.writeSync(file, generateSchemasImports(schemas))
  fs.writeSync(file, `\n`)
  fs.writeSync(file, generateActions(paths))
  fs.closeSync(file)
}

/* Schemas */

{
  const file = fs.openSync(dir + "/schemas.ts", "w")
  fs.writeSync(file, generateSchemas(schemas))
  fs.closeSync(file)
}
