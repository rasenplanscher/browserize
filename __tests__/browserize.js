const test = require('ava')
const fs = require('fs-extra')
const path = require('path')

const browserize = require('..')


const from = filename => path.resolve('__samples__/' + filename)
const out = filename => path.resolve('.samples/' + filename)


test('writes to given file output path, creating directories if needed', t => {
	const dir = out('non-existant')
	const output = path.join(dir, 'file.mjs')

	fs.removeSync(dir)

	t.notThrows(()=>browserize({ output }))
	t.true(fs.existsSync(output))
})


const contentOf = filepath => fs.readFileSync(filepath).toString()
const contains = (filepath, searchstring) => contentOf(filepath).includes(searchstring)
const checkContent = (t, filepath, a, b) => {
	t.true(contains(filepath, a))
	t.false(contains(filepath, b))
}

const defaultPath = from('default.js')
const namedPath = from('named.js')

test('rewrites `module.exports =` as `export default` for default export', t => {
	const output = out('default.mjs')

	browserize({
		default: defaultPath,
		named: null,
		output,
	})

	checkContent(t, defaultPath, 'module.exports = ', 'export ')
	checkContent(t, output, 'export default ', 'module.exports')
})

test('rewrites `module.exports = {` as `export {` for named exports', t => {
	const output = out('named.mjs')

	browserize({
		default: null,
		named: namedPath,
		output,
	})

	checkContent(t, namedPath, 'module.exports = {', 'export ')
	checkContent(t, output, 'export {', 'module.exports')
})

test('concatenates results for combined call', t => {
	const output = out('full.mjs')

	browserize({
		default: defaultPath,
		named: namedPath,
		output,
	})

	checkContent(t, defaultPath, 'module.exports = ', 'export ')
	checkContent(t, namedPath, 'module.exports = {', 'export ')
	checkContent(t, output, 'export default ', 'module.exports')
	t.true(contains(output, 'export {'))
})

test('outputs default before named exports', t => {
	// this is important for using the default in the named context
	// works in combination with the removal of the default require

	const output = out('full.mjs')

	browserize({
		default: defaultPath,
		named: namedPath,
		output,
	})

	const content = contentOf(output)

	t.true(
		content.indexOf('export default')
		<
		content.indexOf('export {')
	)
})

test('removes a require for the default, if present, from the named portion for a combined call', t=> {
	const output = out('full.mjs')

	browserize({
		default: defaultPath,
		named: namedPath,
		output,
	})

	t.true(contains(namedPath, 'const defaultExport = require'))
	t.false(contains(output, 'const defaultExport ='))
})

test('injects double semicolon between default and named exports', t => {
	// this prevents inadvertently calling the last object/function
	// of default from named

	// a single semi would suffice but the double semi
	// makes it clear that this is intentional

	const output = out('full.mjs')

	browserize({
		default: defaultPath,
		named: namedPath,
		output,
	})

	t.false(contains(defaultPath, ';'))
	t.false(contains(namedPath, ';'))
	t.true(contains(output, ';;'))
	t.true(contains(
		output,
		contentOf(defaultPath).match(/defaultExport[\s\S]+/)+'\n;;'
	))
})

test('defaults to `.js` for inputs and `.mjs` for outputs', t => {
	const inputDefault = from('default')
	const inputNamed = from('named')
	const output = out('output')
	const outputExt = output + '.mjs'

	t.false(fs.existsSync(inputDefault))
	t.true(fs.existsSync(inputDefault + '.js'))

	t.false(fs.existsSync(inputNamed))
	t.true(fs.existsSync(inputNamed + '.js'))

	fs.removeSync(outputExt)

	t.notThrows(() => browserize({
		default: inputDefault,
		named: inputNamed,
		output,
	}))
	t.true(fs.existsSync(outputExt))
})

test('writes no default export if given `default: null`', t => {
	const output = out('named-only.mjs')

	browserize({
		default: null,
		named: namedPath,
		output,
	})

	t.false(contains(
		output,
		'export default'
	))
})

test.serial('defaults to `{default: "index.js", named: null, output: "index.mjs"}`', t => {
	const output = from('defaults/index.mjs')

	fs.removeSync(output)
	process.chdir('__samples__/defaults')

	try {
		browserize()
	} catch (error) {
		process.chdir('../..')
		throw error
	}

	t.true(contains(output, 'export default function defaultExportFromIndex'))

	fs.removeSync(output)
})

test ('throws if no input path is given', t => {
	t.throws(() => browserize({
		default: null,
	}))
})
