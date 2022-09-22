# Universal Swagger Exporter

A configurable [Swagger](https://swagger.io/) exporter that parse json data to actions and schemas in TypeScript.

## Setup

Install via `npm`, better as dependency, run this command

```bash
npm i -D swagger-export-actions
```

## Usage

Run `swagger-export-actions` with `input` and `output` options
```bash
npx swagger-export-actions --in data/api.json --out out/data
```

## Notices
#### Query Params
They are stored in `params` property, you will have to handle it in your `intercepter`.
#### Action Import
It is imported as how I would like to use it, you may have to change it.
