const fs = require('fs-extra')
const path = require('path')

module.exports = function browserize(options) {
	const output = browserizeFiles(options)
	writeFile(output, options)
}


function writeFile(data, {
	output: filePath = 'browserized.js',
	encoding = 'utf8',
}) {
	fs.outputFileSync(filePath, data, { encoding })
}

function browserizeFiles({
	default: defaultPath = path.resolve('index.js'),
	named: namedPath,
}) {
	if (defaultPath && namedPath) {
		const defaultExport = browserizeDefault(defaultPath)
		const defaultName = defaultExport.match(/(?:export default )(?:class +|function +|const +)?(\w+)/)[1]

		const namedExport = browserizeNamed(namedPath).replace(new RegExp(`^const +${defaultName} *= *require\\((['"])[^\\1]+\\1\\)`), '')

		return `${defaultExport}\n;;\n${namedExport}`
	}

	if (namedPath) {
		return browserizeNamed(namedPath)
	}

	if (defaultPath) {
		return browserizeDefault(defaultPath)
	}

	throw new Error('Expect at least one input file')
}

function browserizeDefault(filePath) {
	const defaultExportParts = fs.readFileSync(filePath).toString().split(/^module.exports[ \t\n]*=[ \t\n]*/m)

	if (defaultExportParts.length !== 2) {
		throw new Error('Expect exactly one export in default export file')
	}

	return `${defaultExportParts[0]}export default ${defaultExportParts[1]}`
}

function browserizeNamed(filePath) {
	const namedExportsParts = fs.readFileSync(filePath).toString().split(/^(?:module\.)?exports[ \t\n]*=[ \t\n]*\{/m)

	if (namedExportsParts.length !== 2) {
		throw new Error('Expect exactly one grouped export in named exports file')
	}

	return `${namedExportsParts[0]}export {${namedExportsParts[1]}`
}
