const defaultExport = require('./default')
const constant = require('./constant')
let variable = 0
let placeholder

module.exports = { named, exports }

function named () { return placeholder = constant + variable-- }
function exports () { return defaultExport(placeholder) }
