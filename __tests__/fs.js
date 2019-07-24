const ava = require('ava')

const fs = require('fs-extra')
const path = require('path')

const proxyquire = require('proxyquire')


const mainDefault = 'index.js'
const main = 'default.js'
const named = 'named.js'

test('delegates to main function', t => {
	let delegates = false

	proxyquire('../fs.js', {
		'.': () => {
			delegates = true
			return ''
		}
	})()

	t.assert(delegates)
})

test('reads from given paths, defaulting to index.js', (t, p) => {
	let options

	const run = proxyquire('../fs.js', {
		'.': o => {
			options = o
			return ''
		}
	})

	const fileContent = filename => fs.readFileSync(p(filename)).toString()

	run()
	t.is(options.main, fileContent(mainDefault))

	run({ main })
	t.is(options.main, fileContent(main))

	run({ named })
	t.is(options.named, fileContent(named))
	t.is(options.main, fileContent(mainDefault))

	run({ main, named })
	t.is(options.main, fileContent(main))
	t.is(options.named, fileContent(named))

	run({ main: null, named })
	t.is(options.named, fileContent(named))
	t.falsy(options.main)

	run({ imports: {
		'./constant': 'constant.js',
		'./constantX': 'constantX',
	} })
	t.is(options.imports['./constant'], require(p('constant.js')))
	t.is(options.imports['./constantX'], require(p('constantX.js')))
})

test('writes to given path, defaulting to [main|named].mjs', (t, p) => {
	const output = 'OUTPUT'

	const run = proxyquire('../fs.js', {
		'.': () => output
	})

	const outputFile = input => p(input.replace(/\.js$/, '.mjs'))

	const check = (filename, options) => {
		fs.removeSync(outputFile(filename))
		run(options)
		t.is(output, fs.readFileSync(outputFile(filename)).toString())
	}

	check(mainDefault)
	check(main, { main })
	check(mainDefault, { named })
	check(main, { main, named })
	check(named, { main: null, named })
})

test('creates directories if needed', (t, p) => {
	const dir = 'non-existant'
	const output = path.join(dir, 'file.mjs')

	t.notThrows(() => require('../fs')({ output }))
	t.true(fs.existsSync(p(output)))
})

test('throws if no input path is given', t => {
	t.throws(() => require('../fs')({
		main: null,
	}))
})


function test(label, checks) {
	const cwd = process.cwd()
	const dirPath = path.resolve('.samples')

	// do this first instead of cleaning up afterwards
	// enables reviewing the final state
	fs.emptyDirSync(dirPath)
	fs.copySync('__samples__', dirPath)

	const p = (...args) => path.join(dirPath, ...args)

	if (checks) ava.serial(label, t => {
		try {
			process.chdir(dirPath)
			checks(t, p)
		} catch (e) {
			throw e
		} finally {
			process.chdir(cwd)
		}
	})
	else ava.todo(label)
}
