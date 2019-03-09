# browserize
Converts simple node.js modules into ES6 modules.

+ [What it is](#what-it-is)
	+ [What it does](#what-it-does)
	+ [What it does not](#what-it-does-not)
	+ [When to use](#when-to-use)
	+ [When not to use](#when-not-to-use)
	+ ["But browserize does almost what I need"](#but-browserize-does-almost-what-i-need)
+ [How to use it](#how-to-use-it)
	+ [CLI](#cli)
	+ [node API](#node-api)
	+ [Requirements](#requirements)


----


# What it is
+ [What it does](#what-it-does)
+ [What it does not](#what-it-does-not)
+ [When to use](#when-to-use)
+ [When not to use](#when-not-to-use)
+ ["But browserize does almost what I need"](#but-browserize-does-almost-what-i-need)

## What it does
`browserize` turns this:
```js
module.exports = function main() {}
```
```js
const extra = 'EXTRA',
module.exports = {
	extra,
}
```

into this:
```js
export default function main() {}

const extra = 'EXTRA',
export {
	extra,
}
```


### Recognizes references to `main`
`browserize` turns this:
```js
module.exports = function main() { return common }
```

```js
const main = require('./main')
module.exports = {
	extra: main,
}
```

into this:
```js
const common = 'CONSTANT'
export default function main() { return common }

export {
	extra: main,
}
```

This relies


### Merges constants and Variables
`browserize` turns this:
```js
const common = 'CONSTANT'
module.exports = function main() { return common }
```

```js
const common = 'CONSTANT'
module.exports = {
	extra: common,
}
```

into this:
```js
const common = 'CONSTANT'
export default function main() { return common }

export {
	extra: common,
}
```


and this:
```js
let common = 'VARIABLE'
module.exports = function main() { return common }
```

```js
let common = 'VARIABLE'
module.exports = {
	extra: common,
}
```

into this:
```js
let common = 'VARIABLE'
export default function main() { return common }

common = 'VARIABLE'
export {
	extra: common,
}
```

**NOTE:** Since `browserize` cannot know if `common` gets changed in `main.js`, it leaves the assignment in place. If the variable is not assigned in the second file, the declaration is removed.


## What it does not
`browserize` does not:
+ check if the result will run in a browser
+ transform `require`s into `import`s
+ bundle dependencies àla Webpack/Rollup
+ transpile anything other than JavaScript, like CoffeeScript (it might work by coincidence, but there's no support for that)

## When to use
`browserize` is made for small packages without dependencies that should run both in node.js and in the browser.

## When not to use
If your package has any dependency, it's probably complex enough to warrant babel, webpack, or some such. Use that instead.

If you need to transpile anything, like CoffeScript or TypeScript, your tooling for that should cover you.

## "But browserize does almost what I need"
Open an issue, and let's talk about it 😉


# How to use it
+ [node API](#node-api)
+ [CLI](#cli)
+ [Requirements](#requirements)


## node API
You can import either `browserize` or `browserize/fs`, depending on how you will use it.

`browserize` takes an options object with two optional entries:
+ `main`: a string containing the main/default export
+ `named`: a string containing the named exports

`browserize/fs` takes an options object with three optional entries:
+ `main`: the file where the main/default export is found, defaults to `index.js`
+ `named`: where to find the named exports, defaults to `null`
+ `output`: where to write the ESM file, defaults to the `main` or `named` filename with the extension `.mjs`

And that is it.

### Examples
#### The simplest form
```js
const browserizeFS = require('browserize/fs')
browserizeFS()
```
This reads `index.js` and writes the equivalent `index.mjs`, and that's it.


#### Handling in-memory files
```js
const fs = require('fs-extra')
const browserize = require('browserize')
const main = fs.readFileSync('main.js').toString()

browserize({ main })
```
Turns the content of `main.js` into its ESM version.
This is mainly useful if you want to integrate with a build setup using in-memory files, like `gulp`.


#### The most complex case `browserize/fs` covers
```js
const browserize = require('browserize')

browserize({
	default: 'class-name.jsx',
	named: 'helper-functions.js',
	output: 'dist/browser-magic.js',
})
```

This includes named exports and sets custom paths for everything.


## CLI
```bash
npx browserize [--no-default|-x] [[--default|-d] index.js] [[--named|-n] helpers.js] [[--output|-o] index.mjs]
```

The CLI passes the given arguments through to the underlying node API, and works through `browserize/fs`.


### Examples
#### The simplest form
```sh
npx browserize
```

This reads `index.js` and writes the equivalent `index.mjs`, and that's it.


#### Adding named exports
```sh
npm browserize -n helper-functions
```

This reads `index.js` and `helper-functions.js`, then transforms concatenates them, and finally writes the result to `index.mjs`.


#### The most complex case `browserize` covers
```sh
npx browserize class-name.jsx helper-functions.js dist/browser-magic.js
```

This includes named exports and sets custom paths for everything.


## Requirements
`browserize` is a simple tool and has a few simple requirements:


### Each source file must contain exactly one assignment to `module.exports`
#### Good
```js
module.exports = class DefaultExport {}
```
```js
module.exports = {
	key1: helper1,
	key2: helper2,
}
```

#### Bad
```js
exports.key1 = helper1
exports.key2 = helper2
```
While valid, `browserize` does not know how to transform this.

```js
module.exports = export1
module.exports = export2
```
This is not useful anyway.

```js
window.myStuff = class DefaultExport {}
```
This is not a module.


### The default export must be declared without a newline between the assignment operator and the exported item
#### Good
```js
module.exports = class DefaultExport {}
```
```js
module.exports = class DefaultExport {
}
```

#### Bad
```js
module.exports =
class DefaultExport {}
```
While this is valid in node.js, it will lead to an invalid ESM file.


### The named exports must be declared as an object literal
#### Good
```js
module.exports = { helper1, helper2 }
```
```js
module.exports = {
	helper1,
	helper2,
}
```

#### Bad
```js
module.exports.helper1 = helper1
module.exports.helper2 = helper2
```
While this is valid in node.js, `browserize` does not understand it.

This is too complex, and has no real benefit over the object literal.


### The named exports must use shorthand syntax
#### Good
```js
module.exports = {
	helper1,
	helper2,
}
```

#### Bad
```js
module.exports = {
	helper1: helper1,
	helper2: helper2,
}
```
```js
module.exports = {
	key1: helper1,
	key2: helper2,
}
```
While this is valid in node.js, it will lead to an invalid ESM file.
