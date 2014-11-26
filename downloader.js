var ytdl = require('ytdl-core');
var streamifier = require('streamifier')

var Downloader = function(url) {
	this.url = url
	this.sizeDownloaded = 0
	this.downloadProgress = 0
	this.totalSize = 0
	this.progressStep = 5
	this.callbacks = {}
	this.buffer = []
}

Downloader.prototype.download = function() {
	console.log("Downloading video")
	this.stream = ytdl(this.url);

	this.stream.on('info', function(info, format) {
		this.totalSize = format.size
	}.bind(this))

	this.stream.on('data', this.dataHandler.bind(this));
}

Downloader.prototype.dataHandler = function(dataChunk) {
	this.buffer.push(dataChunk)
	this.sizeDownloaded += dataChunk.length
	var progress = Math.floor(100 * this.sizeDownloaded / this.totalSize)
	if(progress == 100 || progress >= this.downloadProgress + this.progressStep) {
		this.downloadProgress = progress
		this._trigger('progress', [progress])
		if(progress == 100) {
			this._trigger('done', [streamifier.createReadStream(Buffer.concat(this.buffer))])
		}
	}
}

Downloader.prototype.on = function(event, cb) {
	if(typeof cb === 'function') {
		this.callbacks[event] = this.callbacks[event] || []
		this.callbacks[event].push(cb)
	}
}

Downloader.prototype._trigger = function(event, args) {
	for(var i in this.callbacks[event]) {
		//console.log(this.callbacks[event][i].toString())
		this.callbacks[event][i].apply(this, args)
	}
}

module.exports = exports.downloader = function(url) {
	if (!/^https?:\/\/\w+\.youtube\.com\/watch\?v=/.test(url)) {
		throw "Invalid youtube url given"+ url
	}
	return new Downloader(url)
}