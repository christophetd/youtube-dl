var randomString 	= require('random-string');
var mkdir 			= require('mkdirp');
var slugify			= require('slug');
var AppSettings 	= require('./AppSettings')
var Zipper			= require('adm-zip');
var VideoFetcher	= require('./VideoFetcher');

var SocketHandler = function(socket) {
	this.socket 		= socket
	this.nbDownloaded 	= 0
	this.nbErrors		= 0
	this.nbVideos		= 0
	this.randomId 		= ''
	socket.on('init', this.init.bind(this))
}

SocketHandler.prototype.init = function(videos) {
	this.nbVideos = videos.length
	this.pickDestinationFolder()

	videos.forEach(function(videoInfo) {
		var videoId 		= videoInfo.url.split("?v=")[1]
		var sanitizedTitle 	= slugify(videoInfo.title, " ")

		var fetcher = new VideoFetcher(videoInfo.url, this.destinationFolder + sanitizedTitle + ".mp3");
		fetcher.onProgress(this.onDownloadProgress.bind(this, videoId))
		fetcher
		.fetch()
		.then(
			function success() {
				++this.nbDownloaded
				this.checkDownloadDone()
			}.bind(this), 
			function error() {
				++this.nbErrors
				this.checkDownloadDone()
			}.bind(this)
		)
	}.bind(this))
}

SocketHandler.prototype.checkDownloadDone = function() {
	if(this.nbDownloaded + this.nbErrors == this.nbVideos) {
		this.onMusicDownloaded()
	}
}

SocketHandler.prototype.onDownloadProgress = function(videoId, progress) {
	this.socket.emit("progress", {
		progress: progress, 
		videoId: videoId
	})
}

SocketHandler.prototype.pickDestinationFolder = function() {
	this.randomId = randomString({
		length: AppSettings.randomIdLength
	})
	this.destinationFolder = AppSettings.tmpDir + this.randomId + '/';
	mkdir.sync(this.destinationFolder)
}

SocketHandler.prototype.onMusicDownloaded = function() {
	var zipPath = this.destinationFolder + AppSettings.zipName
	var zip 	= new Zipper()
	var fullUrl = AppSettings.host()  
		+ AppSettings.downloadRoute.replace(/:id/, this.randomId)

	console.log(this.destinationFolder)
	zip.addLocalFolder(this.destinationFolder)
	zip.writeZip(zipPath)

	this.socket.emit('done', fullUrl)
}

module.exports = function(socket) {
	return new SocketHandler(socket)
}