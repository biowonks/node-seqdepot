'use strict'

const http = require('http')
const bunyan = require('bunyan')

const Nsd = require('./NodeSeqdepotAbstract')

const kDefaults = {
	maxAseqs: 1000
}

module.exports =
class NodeSeqdepot extends Nsd {
    constructor(options, logLevel = 'info') {
		super(options)
		this.log = bunyan.createLogger(
			{
				name: 'node-seqdepot',
				level: logLevel
			}
		)        
    }

    parseAseqList_(aseqs = []) {
        return aseqs.join('\n')
    }

    addAseqInfo(genes = [], options = {keepGoing: false}) {
		this.log.info(`Adding Aseq information for ${genes.length} proteins from SeqDepot`)
		return new Promise((resolve, reject) => {
			const aseqs = []

			genes.forEach((gene) => {
				if (gene.aseq_id)
					aseqs.push(gene.aseq_id)
			})

			const unique = aseqs.filter((v, i, a) => {
				return a.indexOf(v) === i
			})

			const aseqFetches = []
			let error = false

			while (unique.length !== 0) {
				const batch = unique.splice(0, kDefaults.maxAseqs)
				aseqFetches.push(this.getAseqs_(batch, options))
			}
			Promise.all(aseqFetches).then((aseqBatches) => {
				this.log.info('All Aseq has been retrieved, now adding to genes')
				let aseqInfo = []

				aseqBatches.forEach((aseqBatch) => {
					aseqInfo = aseqInfo.concat(aseqBatch)
				})
				genes.forEach((gene) => {
					if (gene.aseq_id) {
						gene.ai = aseqInfo.filter((item) => {
							return gene.aseq_id === item.id
						})[0]
						if (!gene.ai) {
							if (!options.keepGoing) {
								this.log.error(`Aseq ${gene.aseq_id} not found`)
								throw Error(`Aseq ${gene.aseq_id} not found`)
                            }
                            else {
                                this.log.warn(`Aseq ${gene.aseq_id} not found`)
                                gene.ai = null
                            }
						}
					}
					else {
						if (!options.keepGoing) {
							this.log.error(`Gene ${gene.stable_id} has null aseq`)
							throw Error(`Gene ${gene.stable_id} has null aseq`)
                        }
                        else {
                            this.log.warn(`Gene ${gene.stable_id} has null aseq`)
                            gene.ai = null
                        }
					}
				})
				resolve(genes)
			})
				.catch((err) => {
					reject(err)
				})
		})
	}

    processRequest_(data, options = {keepGoing: true}) {
        const entries = data.split('\n')
        const numberOfExpectedFields = 5
        // console.log(entries)
        const items = []
        let buffer = ''
        // console.log('\nEntries --> ' + JSON.stringify(entries))
        entries.forEach((item) => {
            // console.log(item)
            let info = item.split('\t')
            if (info.length !== numberOfExpectedFields) {
                buffer = item
            }
            else if (info[1] === '404') {
                this.log.warn('Aseq not found: ' + ((info[0] !== '') ? info[0] : info[4]))
                items.push({id: info[0]})
            }
            else if (info[1] !== '200') {
                this.log.debug(options)
                if (options.keepGoing) {
                    this.log.warn('SeqDepot problem with: ' + ((info[0] !== '') ? info[0] : info[4]))
                    items.push({id: info[0]})
                }
                else {
                    this.log.error('SeqDepot problem with: ' + ((info[0] !== '') ? info[0] : info[4]))
                    throw new Error('SeqDepot problem with:' + ((info[0] !== '') ? info[0] : info[4]))
                    process.abort()
                }
            }
            else {
                items.push(JSON.parse(info[3]))
            }
        // console.log('Return --> ' + JSON.stringify({buffer, items}))
        })
        return {buffer, items}
    }

    getAseqs_(aseqs = [], options = {keepGoing: false}) {
		this.log.info(`Fetching Aseq Info from SeqDepot`)
        this.httpOptions.method = 'POST'
        const fields = options.fields || ''
		this.httpOptions.path = '/api/v1/aseqs?type=aseq_id'
        this.httpOptions.headers = {
            'Content-Type': 'application/vnd.seqdepot.aseq_id+tsv'
        }
		if (aseqs.length > kDefaults.maxAseqs)
			throw Error('Only 1000 aseqs can be called at once')
		const content = this.parseAseqList_(aseqs)
		this.log.info(`Fetching information for ${aseqs.length} sequences from SeqDepot`)
        let buffer = ''
        const items = []
		return new Promise((resolve, reject) => {
			const req = http.request(this.httpOptions, (res) => {
                if (res.statusCode !== 200)
                    reject(res)
                res.on('data', (data) => {
                    try {
                        const info = this.processRequest_(buffer + data.toString(), options)
                        buffer = info.buffer
                        info.items.forEach((item) => {
                            items.push(item)
                        })
                    }
                    catch (err) {
                        reject(err)
                    }
                })
                res.on('error', (err) => {
                    reject(err)
                })
                res.on('end', () => {
                    this.log.info('All set')
                    resolve(items)
                    // console.log(items)
                })
            })
            req.write(content)
            req.end()
		})
	}


}