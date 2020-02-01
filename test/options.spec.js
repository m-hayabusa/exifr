import {assert} from './test-util.js'
import {getFile, getPath, isNode, isBrowser} from './test-util.js'
import {Options} from '../src/options.js'
import {Exifr} from '../src/index-full.js'


describe('options', () => {

	describe('input shorthands', () => {

		it(`(true) enables all tiff blocks`, async () => {
			let options = new Options(true)
            console.log('-: options', options)
			assert.isTrue(options.ifd0.enabled, 'IFD0 block should be enabled')
			assert.isTrue(options.exif.enabled, 'EXIF block should be enabled')
			assert.isTrue(options.gps.enabled, 'GPS block should be enabled')
			assert.isTrue(options.interop.enabled, 'INTEROP block should be enabled')
			assert.isFalse(options.thumbnail.enabled, 'THUMBNAIL block should be enabled')
		})

		it(`(true) enables all tiff segments`, async () => {
			let options = new Options(true)
			assert.isTrue(options.tiff.enabled, 'TIFF segment should be enabled')
			assert.isTrue(options.jfif.enabled, 'JFIF segment should be enabled')
			assert.isTrue(options.iptc.enabled, 'IPTC segment should be enabled')
			assert.isTrue(options.xmp.enabled, 'XMP segment should be enabled')
			assert.isTrue(options.icc.enabled, 'ICC segment should be enabled')
		})

	})
/*
	describe('options.pick', () => {
	})
*/

	describe('auto filters from segments and makerNote', () => {

		// ApplicationNotes tag contains XMP in .tif files.
		it(`options.ifd0.skip should include 0x02BC ApplicationNotes/XMP when {xmp: false}`, async () => {
			let options = new Options({xmp: false})
			assert.isTrue(options.ifd0.skip.has(0x02BC))
		})

		it(`options.ifd0.skip should include 0x02BC ApplicationNotes/XMP when {xmp: true}`, async () => {
			let options = new Options({xmp: true})
			assert.isFalse(options.ifd0.skip.has(0x02BC))
		})

		it(`options.ifd0.skip should include 0x83bb IPTC when {iptc: false}`, async () => {
			let options = new Options({iptc: false})
			assert.isTrue(options.ifd0.skip.has(0x83bb))
		})

		it(`options.ifd0.skip should include 0x83bb IPTC when {iptc: true}`, async () => {
			let options = new Options({iptc: true})
			assert.isFalse(options.ifd0.skip.has(0x83bb))
		})

		it(`options.ifd0.skip should include 0x8773 ICC when {icc: false}`, async () => {
			let options = new Options({icc: false})
			assert.isTrue(options.ifd0.skip.has(0x8773))
		})

		it(`options.ifd0.skip should include 0x8773 ICC when {icc: true}`, async () => {
			let options = new Options({icc: true})
			assert.isFalse(options.ifd0.skip.has(0x8773))
		})

		it(`options.exif.skip should include 0x927C MakerNote when {makerNote: false}`, async () => {
			let options = new Options({makerNote: false})
			assert.isTrue(options.exif.skip.has(0x927C))
		})

		it(`options.exif.skip should not include 0x927C MakerNote when {makerNote: true}`, async () => {
			let options = new Options({makerNote: true})
			assert.isFalse(options.exif.skip.has(0x927C))
		})

		it(`options.exif.skip should include 0x927C MakerNote by default`, async () => {
			let options = new Options()
			assert.isTrue(options.exif.skip.has(0x927C))
		})

		it(`options.exif.skip should include 0x9286 UserComment when {userComment: false}`, async () => {
			let options = new Options({userComment: false})
			assert.isTrue(options.exif.skip.has(0x9286))
		})

		it(`options.exif.skip should not include 0x9286 UserComment when {userComment: true}`, async () => {
			let options = new Options({userComment: true})
			assert.isFalse(options.exif.skip.has(0x9286))
		})

		it(`options.exif.skip should include 0x9286 UserComment by default`, async () => {
			let options = new Options()
			assert.isTrue(options.exif.skip.has(0x9286))
		})

	})

	describe('options.firstChunkSize', () => {

		isNode && it(`firstChunkSizeNode is a standin for node`, async () => {
			let firstChunkSizeNode = 1234
			let options = new Options({firstChunkSizeNode})
			assert.equal(options.firstChunkSize, firstChunkSizeNode)
		})

		isBrowser && it(`firstChunkSizeBrowser is a standin for browser`, async () => {
			let firstChunkSizeBrowser = 1234
			let options = new Options({firstChunkSizeBrowser})
			assert.equal(options.firstChunkSize, firstChunkSizeBrowser)
		})

		it(`does not have any effect if input is buffer`, async () => {
			let size = 456
			let exr = new Exifr({firstChunkSize: size})
			await exr.read(await getPath('IMG_20180725_163423.jpg'))
			assert.equal(exr.file.byteLength, size)
			await exr.file.close()
		})

	})

	describe('options.chunkSize', () => {

		it(`affects size of the chunk following firstChunkSize`, async () => {
			let firstChunkSize = 101
			let chunkSize = 100
			let exr = new Exifr({firstChunkSize, chunkSize})
			await exr.read(await getPath('IMG_20180725_163423.jpg'))
			assert.equal(exr.file.byteLength, firstChunkSize)
			await exr.file.readNextChunk()
			assert.equal(exr.file.byteLength, firstChunkSize + chunkSize)
			await exr.file.close()
		})

	})

	describe('options.chunked', () => {

		let simpleFile = getPath('IMG_20180725_163423.jpg')

		// Exif is scattered throughout the file.
		// Header at the beginning of file, data at the end.
		// tiff offset at 0; ID0 offset at 677442
		let scatteredFileName = '001.tif'
		let scatteredFilePath = getPath(scatteredFileName)

		describe('chunked: false', () => {

			it(`does not have any effect if input is buffer`, async () => {
				let exr = new Exifr({chunked: false})
				await exr.read(await getFile(scatteredFileName))
				assert.isNotTrue(exr.file.chunked)
			})

			it(`simple file should be read as a whole`, async () => {
				let options = {chunked: false}
				let exr = new Exifr(options)
				await exr.read(simpleFile)
				assert.isFalse(exr.file.chunked)
				await exr.file.close()
			})

			it(`scattered file should read as a whole`, async () => {
				let options = {chunked: false}
				let exr = new Exifr(options)
				await exr.read(scatteredFilePath)
				assert.isFalse(exr.file.chunked)
				await exr.file.close()
			})

		})

		describe('chunked: true', () => {

			it(`does not have any effect if input is buffer`, async () => {
				let exr = new Exifr({chunked: true})
				await exr.read(await getFile(scatteredFileName))
				assert.isNotTrue(exr.file.chunked)
			})

			it(`simple file should be read in chunked mode`, async () => {
				let options = {chunked: true}
				let exr = new Exifr(options)
				await exr.read(simpleFile)
				assert.isTrue(exr.file.chunked)
				await exr.file.close()
			})

			it(`scattered file should be read in chunked mode`, async () => {
				let options = {chunked: true}
				let exr = new Exifr(options)
				await exr.read(scatteredFilePath)
				assert.isTrue(exr.file.chunked)
				await exr.file.close()
			})

		})

	})

})
