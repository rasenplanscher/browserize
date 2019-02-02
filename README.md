# ✨`browserize`✨
Converts simple node.js modules into ES6 modules.

----
## Table of Contents
+ [🎭 What it is](#-what-it-is)
	+ [👍 What it does](#-what-it-does)
	+ [⛔ What it does not](#-what-it-does-not)
	+ [✔ When to use](#-when-to-use)
	+ [❌ When not to use](#-when-not-to-use)
	+ [😇 "But browserize does almost what I need"](#-but-browserize-does-almost-what-i-need)
+ [🛠 How to use it](#-how-to-use-it)
	+ [💏 Two examples](#-two-examples)
	+ [🧰 API](#-api)
	+ [📋 Requirements](#-requirements)


----
##
----

# 🎭 What it is
## 👍 What it does
`browserize` turns this:
```js
module.exports = function defaultExport() {}
```

into this:
```js
export default function defaultExport() {}
```


## ⛔ What it does not
`browserize` does not:
+ check if the result will run in a browser
+ transform `require`s into `import`s
+ bundle dependencies àla Webpack/Rollup

## ✔ When to use
`browserize` is made for small packages without dependencies that should run both in node.js and in the browser.

## ❌ When not to use
If your package has any dependency, it's probably complex enough to warrant babel, webpack, or some such. Use that instead.

## 😇 "But browserize does almost what I need"
Open an issue, and let's talk about it 😉


# 🛠 How to use it

## 💏 Two examples
### ⚪ The simplest form
```js
const browserize = require('browserize')
browserize()
```
This reads `index.js` and writes the equivalent `index.mjs`, and that's it.


### 🔻 The most complex case `browserize` covers
```js
const browserize = require('browserize')
const path = require('path')

browserize({
	default: 'class-name.jsx',
	named: 'helper-functions.js',
	output: 'dist/browser-magic.js',
})
```

This includes named exports and sets custom paths for everything.


## 🧰 API
`browserize` takes an options object with three optional entries:
+ `default`: the file where the default export is found, defaults to `index.js`
+ `named`: where to find the named exports, defaults to `null`
+ `output`: where to write the ESM file, defaults to `index.mjs`

And that is it.


## 📋 Requirements
`browserize` is a simple tool and has a few simple requirements:

### 1️⃣ Each source file must contain exactly one assignment to `module.exports`
#### 😃 Good
```js
module.exports = class DefaultExport {}
```
```js
module.exports = {
	key1: helper1,
	key2: helper2,
}
```

#### 😒 Bad
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

### ➡ The default export must be declared without a newline between the assignment operator and the exported item
#### 😃 Good
```js
module.exports = class DefaultExport {}
```
```js
module.exports = class DefaultExport {
}
```

#### 😒 Bad
```js
module.exports =
class DefaultExport {}
```
While this is valid in node.js, it will lead to an invalid ESM file.

### 🔡 The named exports must be declared as an object literal
#### 😃 Good
```js
module.exports = { helper1, helper2 }
```
```js
module.exports = {
	key1: helper1,
	key2: helper2,
}
```

#### 😒 Bad
```js
module.exports.key1 = helper1
module.exports.key2 = helper2
```
While this is valid in node.js, `browserize` does not understand it.

This is too complex, and has no real benefit over the object literal.
