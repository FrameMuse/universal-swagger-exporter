# swagger-export-rfl

Automated script | [Swagger](https://swagger.io/) export to [react-fetching-library](https://github.com/marcin-piela/react-fetching-library) actions

## Setup

To install

- Clone this repo
- Run `npm i`

## Usage

To use

- Put your data to [`data/api.json`](https://github.com/FrameMuse/swagger-export-rfl/blob/main/data/api.json)
- Run `npm run build` to compile source files
- Run `npm start`, your output files will be in `out` directory
- _Or run only `npm run compile`_
- Enjoy yourself!

## Notices
#### Query Params
They are stored in `params` property, you will have to handle it in your `intercepter`.
#### Action Import
It is imported as how I would like to use it, you may have to change it.
