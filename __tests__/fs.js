const test = require('ava')

const fs = require('fs-extra')
const path = require('path')

const browserizeFS = require('../fs')


const from = filename => path.resolve('__samples__/' + filename)
const out = filename => path.resolve('.samples/' + filename)


test('writes to given file output path, creating directories if needed', t => {
	const dir = out('non-existant')
	const output = path.join(dir, 'file.mjs')

	fs.removeSync(dir)

	t.notThrows(()=>browserizeFS({ output }))
	t.true(fs.existsSync(output))
})


const contentOf = filepath => fs.readFileSync(filepath).toString()
const contains = (filepath, searchstring) => contentOf(filepath).includes(searchstring)
const checkContent = (t, filepath, a, b) => {
	t.true(contains(filepath, a))
	t.false(contains(filepath, b))
}

const main = from('default.js')
const named = from('named.js')

test('rewrites `module.exports =` as `export default` for default export', t => {
	const output = out('default.mjs')

	browserizeFS({
		main,
		named: null,
		output,
	})

	checkContent(t, main, 'module.exports = ', 'export ')
	checkContent(t, output, 'export default ', 'module.exports')
})

test('rewrites `module.exports = {` as `export {` for named exports', t => {
	const output = out('named.mjs')

	browserizeFS({
		main: null,
		named,
		output,
	})

	checkContent(t, named, 'module.exports = {', 'export ')
	checkContent(t, output, 'export {', 'module.exports')
})

test('concatenates results for combined call', t => {
	const output = out('full.mjs')

	browserizeFS({
		main,
		named,
		output,
	})

	checkContent(t, main, 'module.exports = ', 'export ')
	checkContent(t, named, 'module.exports = {', 'export ')
	checkContent(t, output, 'export default ', 'module.exports')
	t.true(contains(output, 'export {'))
})

test('outputs default before named exports', t => {
	// this is important for using the default in the named context
	// works in combination with the removal of the default require

	const output = out('full.mjs')

	browserizeFS({
		main,
		named,
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

	browserizeFS({
		main,
		named,
		output,
	})

	t.true(contains(named, 'const defaultExport = require'))
	t.false(contains(output, 'const defaultExport ='))
})

test('injects double semicolon between default and named exports', t => {
	// this prevents inadvertently calling the last object/function
	// of default from named

	// a single semi would suffice but the double semi
	// makes it clear that this is intentional

	const output = out('full.mjs')

	browserizeFS({
		main,
		named,
		output,
	})

	t.false(contains(main, ';'))
	t.false(contains(named, ';'))
	t.true(contains(output, ';;'))
	t.true(contains(
		output,
		contentOf(main).match(/defaultExport[\s\S]+/)+'\n;;'
	))
})

test('defaults to `.js` for inputs and `.mjs` for outputs', t => {
	const mainNoExt = from('default')
	const namedNoExt = from('named')
	const outputNoExt = out('output')
	const outputExt = outputNoExt + '.mjs'

	t.false(fs.existsSync(mainNoExt))
	t.true(fs.existsSync(mainNoExt + '.js'))

	t.false(fs.existsSync(namedNoExt))
	t.true(fs.existsSync(namedNoExt + '.js'))

	fs.removeSync(outputExt)

	t.notThrows(() => browserizeFS({
		main: mainNoExt,
		named: namedNoExt,
		output: outputNoExt,
	}))
	t.true(fs.existsSync(outputExt))
})

test('writes no default export if given `main: null`', t => {
	const output = out('named-only.mjs')

	browserizeFS({
		main: null,
		named,
		output,
	})

	t.false(contains(
		output,
		'export default'
	))
})

test.serial('defaults to `{main: "index.js", named: null, output: "index.mjs"}`', t => {
	const output = from('defaults/index.mjs')

	fs.removeSync(output)
	process.chdir('__samples__/defaults')

	try {
		browserizeFS()
	} catch (error) {
		throw error
	} finally {
		process.chdir('../..')
	}


	t.true(contains(output, 'export default function defaultExportFromIndex'))

	fs.removeSync(output)
})

test.serial('defaults to default filename for output, with `.mjs` extension', t => {
	const input = from('defaults/output.js')
	const output = from('defaults/output.mjs')

	fs.removeSync(output)

	browserizeFS({ main: input })

	t.true(contains(output, 'export default function defaultExportFromOutput'))

	fs.removeSync(output)
})

test.serial('defaults to named filename for output, if default is excluded', t => {
	const input = from('defaults/output-named.js')
	const output = from('defaults/output-named.mjs')

	fs.removeSync(output)

	browserizeFS({
		main: null,
		named: input,
	})

	t.true(contains(output, 'export {}'))

	fs.removeSync(output)
})

test ('throws if no input path is given', t => {
	t.throws(() => browserizeFS({
		main: null,
	}))
})
