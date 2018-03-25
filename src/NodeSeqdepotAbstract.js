'use strict'

let httpDefaultOptions = {
	hostname: 'seqdepot.net',
	port: 80,
	headers: {},
	agent: false
}

module.exports =
class NodeSeqdepotAbstract {
	constructor(options) {
		this.httpOptions = options ? options : httpDefaultOptions
	}
}
