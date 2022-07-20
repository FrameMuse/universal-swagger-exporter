# swagger-export-actions

Automated script | [Swagger](https://swagger.io/) export to [react-fetching-library](https://github.com/marcin-piela/react-fetching-library) actions

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
