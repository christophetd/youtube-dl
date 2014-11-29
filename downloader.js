var ffmpeg 		= require('fluent-ffmpeg')
var fs 			= require('fs')
var ytdl 		= require('ytdl-core')
var Q			= require('q')

var Downloader = function(options) {
	this.url = options.url
	this.destFile = options.destination
	this.bitrate = options.bitrate || 256
	this.onProgressCb = function(){}
	this.progressStep = options.progressStep || 5
	this.totalSize = 0
	this.sizeDownloaded = 0
	this.downloadProgress = 0
}

/*
 * Sets the callback to be called every [progressStep] % of the download progress
 */
Downloader.prototype.onProgress = function(cb) {
	this.onProgressCb = cb
}

/*
 *	Launches the download. Returns a promise
 */
Downloader.prototype.download = function() {
	var deferred = Q.defer()
	this._download(deferred.resolve, deferred.reject)
	return deferred.promise
}

/* 
 *	Resolver for the download promise
 */
Downloader.prototype._download = function(success, error) {
	var stream = ytdl(this.url)

	stream.on('info', function(info, format) {
		this.totalSize = format.size
	}.bind(this))

	stream.on('error', error)

	stream.on('data', this._onStreamDataReceived.bind(this))

	new ffmpeg({
		source: stream
	})	
	  .withAudioBitrate(this.bitrate)
	  .saveToFile(this.destFile)
	  .on('end', success)
	  .on('error', function() {
			console.log("Error during conversion")
			error.apply(arguments)
	  })
}

Downloader.prototype._onStreamDataReceived = function(chunk) {
	var size = chunk.length
	this.sizeDownloaded += size

	var progress = Math.floor(100 * this.sizeDownloaded / this.totalSize)

	if(progress == 100 || progress >= this.downloadProgress + this.progressStep) {
		this.downloadProgress = progress
		this.onProgressCb.apply(null, [progress])
	}
}

module.exports = exports.Downloader = Downloader;