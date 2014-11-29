var AppSettings 	= require('./AppSettings')
var Downloader		= require('./Downloader');
var randomString 	= require('random-string');
var mkdir 			= require('mkdirp');
var slugify			= require('slug');
var Zipper			= require('adm-zip');
var archiver		= require('archiver');
var Q				= require('Q');
var fs 				= require('fs');

var SocketHandler = function(socket) {
	this.socket 		= socket
	this.nbDownloaded 	= 0
	this.nbErrors		= 0
	this.nbVideos		= 0
	this.randomId 		= ''
	this.pendingDownloads = []
	this.bitrate 		= AppSettings.defaultBitrate
	socket.on('init', this.init.bind(this))
}

SocketHandler.prototype.init = function(infos) {
	var videos 		= infos.videos
	this.bitrate 	= infos.quality || this.bitrate
	this.nbVideos 	= videos.length
	this.pickDestinationFolder()

	videos.forEach(function(videoInfo) {
		var videoId 		= videoInfo.url.split("?v=")[1]
		var sanitizedTitle 	= slugify(videoInfo.title, " ")
		//var downloader = new Downloader(videoInfo.url, this.destinationFolder + sanitizedTitle + ".mp3");
		var downloader = new Downloader({
			url: videoInfo.url, 
			destination: this.destinationFolder + sanitizedTitle + ".mp3", 
			bitrate: this.bitrate
		})
		downloader.onProgress(this.onDownloadProgress.bind(this, videoId))
		this.pendingDownloads.push(downloader.download())
	}.bind(this))

	Q.all(this.pendingDownloads)
	 .then(this.onMusicDownloaded.bind(this))
	 .fail(function(err) {
	 	console.log("An error has occured : "+err)
	 	this.socket.emit('error', err)
	 }.bind(this))
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
	var zip = archiver('zip')
	var stream = fs.createWriteStream("./"+zipPath)	
	var fullUrl = AppSettings.host()  
		+ AppSettings.downloadRoute.replace(/:id/, this.randomId)

	stream.on('error', function(err) { throw err })

	zip.on('error', function(err) {
		throw err
	})

	zip.bulk([
	  { src: ['./*.mp3'], cwd: './' + this.destinationFolder, expand: true}
	]);	
	zip.pipe(stream)	
	zip.finalize()

	this.socket.emit('done', fullUrl)
}

module.exports = function(socket) {
	return new SocketHandler(socket)
}