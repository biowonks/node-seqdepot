'use strict'

let httpDefaultOptions = {
	hostname: 'seqdepot.net',
	port: 80,
	headers: {},
	agent: false
}

module.exports =
class NodeMist3 {
	constructor(options) {
		this.httpOptions = options ? options : httpDefaultOptions
	}
}
