const constant = require('./constant')
let variable = 0
let placeholder

module.exports = function defaultExport () {
	placeholder += constant + variable++
	return placeholder
}
