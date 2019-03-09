const test = require('ava')
const fs = require('fs-extra')
const path = require('path')

const browserize = require('..')


const sample = filename => fs.readFileSync(path.resolve(__dirname, '..', '__samples__', filename)).toString()

const checkContent = (t, data, a, b) => {
	t.true(data.includes(a))
	t.false(data.includes(b))
}

const main = sample('default.js')
const named = sample('named.js')

test('rewrites `module.exports =` as `export default` for main export', t => {
	const output = browserize({ main })

	checkContent(t, main, 'module.exports = ', 'export ')
	checkContent(t, output, 'export default ', 'module.exports')
})

test('rewrites `module.exports = {` as `export {` for named exports', t => {
	const output = browserize({ named })

	checkContent(t, named, 'module.exports = {', 'export ')
	checkContent(t, output, 'export {', 'module.exports')
})

test('concatenates results for combined call', t => {
	const output = browserize({
		main,
		named,
	})

	checkContent(t, main, 'module.exports = ', 'export ')
	checkContent(t, named, 'module.exports = {', 'export ')
	checkContent(t, output, 'export default ', 'module.exports')
	t.true(output.includes('export {'))
})

test('outputs default before named exports', t => {
	// this is important for using the default in the named context
	// works in combination with the removal of the default require

	const output = browserize({
		main,
		named,
	})

	t.true(
		output.indexOf('export default')
		<
		output.indexOf('export {')
	)
})

test('removes a require for the default, if present, from the named portion for a combined call', t=> {
	const output = browserize({
		main,
		named,
	})

	t.true(named.includes('const defaultExport = require'))
	t.false(output.includes('const defaultExport ='))
})

test('injects double semicolon between default and named exports', t => {
	// this prevents inadvertently calling the last object/function
	// of default from named

	// a single semi would suffice but the double semi
	// makes it clear that this is intentional

	const output = browserize({
		main,
		named,
	})

	t.false(main.includes(';'))
	t.false(named.includes(';'))
	t.true(output.includes(';;'))
	t.true(output.includes(
		main.match(/defaultExport[\s\S]+/)+'\n;;'
	))
})
