module.exports = function browserize({ main, named }) {
	if (main && named) {
		const mainExport = browserizeMain(main)
		const mainName = mainExport.match(/export +default +(?:class +|function +|const +)?(\w+)/)[1]

		const namedExport = browserizeNamed(named, new RegExp(`^const +${mainName} *= *require\\((?:'[^']+'|"[^"]+")\\)`))

		return `${mainExport}\n;;\n${namedExport}`
	}

	if (named) {
		return browserizeNamed(named)
	}

	if (main) {
		return browserizeMain(main)
	}


	throw new Error('Expect at least one input file')
}

function browserizeMain(data) {
	const mainExportParts = data.split(/^module\.exports[ \t\n]*=[ \t\n]*/m)

	if (mainExportParts.length !== 2) {
		throw new Error('Expect exactly one export in default export file')
	}

	return `${mainExportParts[0]}export default ${mainExportParts[1]}`
}

function browserizeNamed(data, defaultExport) {
	const namedExportsParts = data.split(/^module\.exports[ \t\n]*=[ \t\n]*\{/m)

	if (namedExportsParts.length !== 2) {
		throw new Error('Expect exactly one grouped export in named exports file')
	}

	let browserizedContent = `${namedExportsParts[0]}export {${namedExportsParts[1]}`

	if (defaultExport) {
		browserizedContent = browserizedContent.replace(defaultExport, '')
	}

	return browserizedContent
}
