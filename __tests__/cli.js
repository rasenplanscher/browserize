const test = require('ava')
const proxyquire = require('proxyquire')


const [p1, p2, p3] = ['p1', 'p2', 'p3']


test('no parameters', t => {
	checkOptions(t)
})

test('positional parameters', t => {
	checkOptions(t,
		'p1 p2 p3',
		p1, p2, p3
	)
})

test('named parameters', t => {
	checkOptions(t,
		'--output p1 --default p2 --named p3',
		p2, p3, p1
	)
})

test('shorthand parameters', t => {
	checkOptions(t,
		'--n p1 --o p2 --d p3',
		p3, p1, p2
	)
})

test('mixed parameters', t => {
	checkOptions(t,
		'-n p1 p2 p3',
		p2, p1, p3
	)

	checkOptions(t,
		'p1 p2 -n p3',
		p1, p3, p2
	)

	checkOptions(t,
		'p1 -o p2 p3',
		p1, p3, p2
	)
})

test('disabled default', t => {
	checkOptions(t,
		'--no-default',
		null, undefined, undefined
	)

	checkOptions(t,
		'-x',
		null, undefined, undefined
	)

	checkOptions(t,
		'-x p1 p2',
		null, p1, p2
	)

	checkOptions(t,
		'-o p1 p2 -x',
		null, p2, p1
	)

	checkOptions(t,
		'-xo p1 p2',
		null, p2, p1
	)
})


function checkOptions (t, input, main, named, output) {
	process.argv = ['npx', 'browserize']
	if (input) process.argv.push(...input.split(' '))

	let options
	proxyquire('../cli.js', {
		'./fs': o => { options = o }
	})

	t.deepEqual(options, {
		default: main,
		named,
		output,
	})
}
