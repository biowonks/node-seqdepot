'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

const expect = chai.expect
const should = chai.should()
const NodeSeqdepot = require('./NodeSeqdepot')

describe('NodeSeqdepot', function() {
	describe('addAseqInfo', function() {
		it('should pass', function() {
			this.timeout(14000)
			const nsd = new NodeSeqdepot()
            const genes = [
                {
                    aseq_id: 'npORB8GGfXLBYjo0s3_QNQ'
                },
                {
                    aseq_id: 'lXFJ1g8Tyb15AP8olkZ1eQ'
                }
            ]
            return nsd.addAseqInfo(genes).then((items) => {
                expect(items.length).eql(genes.length)                
			})
		})
		it('must fail if passed invalid version', function() {
			this.timeout(14000)
			const nsd = new NodeSeqdepot()
            const genes = [
                {
                    aseq_id: 'npORB8GGfXLBYjo0s3_QNQ'
                },
                {
                    aseq_id: 'lXFJ1g8Tyb15AP8ol_sZ1eQ'
                }
            ]
            return nsd.addAseqInfo(genes).should.be.rejected
        })
        it('must pass if passed invalid version but asked to keep going', function() {
			this.timeout(14000)
			const nsd = new NodeSeqdepot()
            const genes = [
                {
                    aseq_id: 'npORB8GGfXLBYjo0s3_QNQ'
                },
                {
                    aseq_id: 'lXFJ1g8Tyb15AP8ol_skZ1eQ'
                }
            ]
            return nsd.addAseqInfo(genes, {keepGoing: true}).then((items) => {
                expect(items.length).eql(genes.length)
                expect(items[1].ai).to.be.null             
			})
		})
    })
})