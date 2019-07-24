module.exports = function browserize({ main, named, imports={} }) {
	if (main && named) {
		return interpolateImports(
			browserizeBoth(main, named),
			imports,
		)
	}

	if (named) {
		return interpolateImports(
			browserizeNamed(named),
			imports,
		)
	}

	if (main) {
		return interpolateImports(
			browserizeMain(main),
			imports,
		)
	}

	throw new Error('Expect at least one input file')
}

function browserizeBoth(main, named) {
	const mainExport = browserizeMain(main)
	const mainName = mainExport.match(/export +default +(?:class +|function +|const +)?(\w+)/)[1]

	const namedExport = browserizeNamed(named, new RegExp(`^const +${mainName} *= *require\\((?:'[^']+'|"[^"]+")\\)`))

	return `${mainExport}\n;;\n${deduplicate(namedExport, mainExport)}`
}


function browserizeMain(file) {
	const mainExportParts = file.split(/^module\.exports[ \t\n]*=[ \t\n]*/m)

	if (mainExportParts.length !== 2) {
		throw new Error('Expect exactly one export in default export file')
	}

	return `${mainExportParts[0]}export default ${mainExportParts[1]}`
}

function browserizeNamed(file, defaultExport) {
	const namedExportsParts = file.split(/^module\.exports[ \t\n]*=[ \t\n]*\{/m)

	if (namedExportsParts.length !== 2) {
		throw new Error('Expect exactly one grouped export in named exports file')
	}

	let browserizedContent = `${namedExportsParts[0]}export {${namedExportsParts[1]}`

	if (defaultExport) {
		browserizedContent = browserizedContent.replace(defaultExport, '')
	}

	return browserizedContent
}


//


function interpolateImports(baseFile, imports) {
	return Object.entries(imports).reduce((file, [path, data]) => (
		file.replace(
			new RegExp(`require\\((['"])${path}\\1\\)`, 'g'),
			() => JSON.stringify(data)
		)
	), baseFile)
}


function deduplicate(named, main) {
	return named
	.replace(
		/\bconst +(\w+)\s*=\s*([^\n]+);?\n/g,
		(match, name, value) => {
			const sameValue = new RegExp(
				`\\bconst +${
					name
				}\\s*=\\s*${
					value.replace(/([(.)])/g,'\\$1')
				}`
			)
			const anyValue = new RegExp(
				`\\bconst +${
					name
				}\\b`
			)

			if (sameValue.test(main)) {
				return ''
			}

			if (anyValue.test(main)) {
				throw new Error(`constant ${name} has different values`)
			}

			return match
		}
	)
	.replace(
		/\b(?:let|var) +(\w+)(\s*=)?/g,
		(match, name, assignment) => {
			const variable = new RegExp(
				`\\b(?:let|var) +${
					name
				}\\b`
			)

			if (variable.test(main)) {
				if (assignment) {
					return `${name} =`
				}

				return ''
			}

			return match
		}
	)
}
