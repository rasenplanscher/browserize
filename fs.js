const fs = require('fs-extra')
const path = require('path')

const browserize = require('.')


const defaultFilePath = 'index'
const defaultInputExtension = '.js'
const defaultOutputExtension = '.mjs'

module.exports = function browserizeFS(options = {}) {
	const files = readFiles(options)

	const data = browserize({
		...options,
		...files,
	})

	writeFile(data, options)
}


//


function readFiles({
	main: mainPath = defaultFilePath,
	named: namedPath,
	imports: imports,
}) {
	const files = {}

	if (mainPath) {
		if (!path.extname(mainPath)) {
			mainPath = mainPath + defaultInputExtension
		}

		files.main = fs.readFileSync(mainPath).toString()
	}

	if (namedPath) {
		if (!path.extname(namedPath)) {
			namedPath = namedPath + defaultInputExtension
		}

		files.named = fs.readFileSync(namedPath).toString()
	}

	if (imports) {
		files.imports = {}

		Object.entries(imports).forEach(([importPath, filePath]) => {
			files.imports[importPath] = require(path.resolve(filePath))
		})
	}

	return files
}

function writeFile(data, {
	main: mainPath = defaultFilePath,
	named: namedPath,
	output: filePath,
	encoding = 'utf8',
}) {
	if (!filePath) {
		if (!mainPath) {
			mainPath = namedPath
		}

		filePath = path.join(
			path.dirname(mainPath),
			path.basename(
				mainPath,
				path.extname(mainPath)
			)
		)
	}

	if (filePath && !path.extname(filePath)) {
		filePath = filePath + defaultOutputExtension
	}

	fs.outputFileSync(filePath, data, { encoding })
}
