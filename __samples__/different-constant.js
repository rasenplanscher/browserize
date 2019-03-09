const defaultExport = require('./default')
const constant = 'different value'

module.exports = { named, exports }

function named () { return constant }
function exports () { return defaultExport() }
