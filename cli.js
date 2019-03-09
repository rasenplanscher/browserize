#!/usr/bin/env node
'use strict';

// drop `node` and `cli.js`, the actual parameters come after those
const p = require('minimist')(process.argv.slice(2));

const fs = require('./fs');

let defaultPath, namedPath, outputPath


if ((p.default === false) || p.x) {
	defaultPath = null
	if(typeof p.x === 'string') {
		p._.unshift(p.x)
	}
} else {
	defaultPath = p.default || p.d || p._.shift()
}

namedPath = p.named || p.n || p._.shift()
outputPath = p.output || p.o || p._.shift()


fs({
	default: defaultPath,
	named: namedPath,
	output: outputPath,
})
