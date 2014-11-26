var Downloader 	= require('./downloader')
var ffmpeg 		= require('fluent-ffmpeg')
var Promise 	= require('promise')
var fs 			= require('fs')

var VideoFetcher = function(url, destFile) {
	this.url = url
	this.destFile = destFile;
	this.onProgressCb = function(){}
}

VideoFetcher.prototype.onProgress = function(cb) {
	this.onProgressCb = cb
}

// Downloads And converts
VideoFetcher.prototype.fetch = function() {
	return new Promise(this._resolver.bind(this))
}

VideoFetcher.prototype._resolver = function(resolve, reject) {
	var downloader 	= new Downloader(this.url)
	downloader.on('progress', this.onProgressCb)
	downloader.on('done', function(videoStream) {
		ffmpeg(videoStream)
		.withAudioBitrate("320")
		.saveToFile(this.destFile)
		.on('end', resolve)
		.on('error', reject)
	}.bind(this))

	downloader.download()
}

module.exports = exports.VideoFetcher = VideoFetcher;