var randomString 	= require('random-string');
var mkdir 			= require('mkdirp');
var slugify			= require('slug');
var AppSettings 	= require('./AppSettings')
var Zipper			= require('adm-zip');
var Downloader		= require('./Downloader');
var archiver		= require('archiver');
var Q				= require('Q')
var SocketHandler = function(socket) {
	this.socket 		= socket
	this.nbDownloaded 	= 0
	this.nbErrors		= 0
	this.nbVideos		= 0
	this.randomId 		= ''
	this.pendingDownloads = []
	socket.on('init', this.init.bind(this))
}

SocketHandler.prototype.init = function(videos) {
	this.nbVideos = videos.length
	this.pickDestinationFolder()

	videos.forEach(function(videoInfo) {
		var videoId 		= videoInfo.url.split("?v=")[1]
		var sanitizedTitle 	= slugify(videoInfo.title, " ")
		var downloader = new Downloader(videoInfo.url, this.destinationFolder + sanitizedTitle + ".mp3");
		downloader.onProgress(this.onDownloadProgress.bind(this, videoId))
		this.pendingDownloads.push(downloader.download())
	}.bind(this))

	Q.all(this.pendingDownloads)
	 .then(this.onMusicDownloaded.bind(this))
	 .fail(function() {
	 	console.log("An error has occured")
	 })
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
	console.log("Music downloaded !")
	var zipPath = this.destinationFolder + AppSettings.zipName
	var zip = archiver('zip')
	//var zip 	= new Zipper()
	var fullUrl = AppSettings.host()  
		+ AppSettings.downloadRoute.replace(/:id/, this.randomId)

	console.log("Dest folder : ./"+this.destinationFolder)
	console.log("Dest zip : ./"+zipPath)

	var stream = fs.createWriteStream("./"+zipPath)	
	console.log("Stream ok")
	stream.on('error', function() { console.log("Stream error ")})
	zip.on('error', function(err) {
		console.log("Error : %s", err)
	})

	zip.bulk([
	  { src: ['./**'],  cwd: "./" + this.destinationFolder, expand: true}
	]);
	console.log("Bulk ok")
	
	zip.pipe(stream)	

	console.log("pipe ok")
	zip.finalize()



	/*zip.addLocalFolder(this.destinationFolder)
	zip.writeZip(zipPath)*/

	this.socket.emit('done', fullUrl)
}

module.exports = function(socket) {
	return new SocketHandler(socket)
}