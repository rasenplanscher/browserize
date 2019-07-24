const constant = require('./constant')
const constantX = require('./constantX')

let variable = 0
let placeholder

module.exports = function defaultExport () {
	placeholder += constant + constantX + variable++
	return placeholder
}
