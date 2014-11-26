var AppSettings 	= require('./AppSettings');
var express 		= require('express');
var app 			= express();
var server 			= require('http').Server(app);
var io 				= require('socket.io')(server);
var VideoFetcher	= require('./VideoFetcher');
var slugify			= require('slug');
var randomString 	= require('random-string');
var mkdir 			= require('mkdirp');
var fs				= require('fs')
var Zipper			= require('adm-zip');

var port = process.env.PORT || AppSettings.defaultPort

server.listen(port);


app.get('/dl/:id', function(req, res, next) {
	var id = req.params.id
	var zipPath = "./tmp/"+id+"/musics.zip"
	var regex = new RegExp("^[a-zA-Z0-9]{"+AppSettings.randomIdLength+"}$")
	console.log(zipPath)
	if(!regex.test(id) || !fs.existsSync(zipPath)) {
		res.writeHead(400, "Bad request")
		res.end();
		return
	}

	// Send zip in response
	var fileStats = fs.statSync(zipPath)
	res.writeHead(200, {
		"Content-Type": "application/octet-stream", 
		"Content-Length": fileStats.size, 
		"Content-Disposition": 'inline; filename="musics.zip"'
	})

	var stream = fs.createReadStream(zipPath)

	var handleError = function(err) {
		res.writeHead(500, "Internal error")
		stream.end()
	}

	res.on('error', handleError)
	stream.on('error', handleError)

	stream.pipe(res)
})
app.use(express.static(__dirname + '/static'));

var socket
var nbVideos = 0
var nbDownloaded = 0

io.on('connection', function(connection) {
	socket = connection
	socket.on('init', initFetching)
})

function initFetching(videos) {
	nbVideos = videos.length
	var destDirectory = "./tmp/"+randomString({length: AppSettings.randomIdLength})+"/";
	mkdir.sync(destDirectory)

	for(var i in videos) {
		console.log("Fetching video "+videos[i].title+"...")
		var videoId = videos[i].url.split("?v=")[1]
		var sanitizedTitle = slugify(videos[i].title, " ")

		var fetcher = new VideoFetcher(videos[i].url, destDirectory+sanitizedTitle+".mp3");
		fetcher.onProgress(function(videoId, p) {
			socket.emit("progress", {progress:p, videoId: videoId})
		}.bind(null, videoId))
		fetcher.fetch()
			.then(function(videoId, nb) {
				++nbDownloaded;
				console.log("Video "+videoId+" successfuly converted")
				checkDone()
			}.bind(null, videoId), 
			function(videoId, e) {
				++nbDownloaded;
				console.log("Error while converting "+videoId+": "+e)
				checkDone()
			}.bind(null, videoId))
	}

	function checkDone() {
		console.log(nbDownloaded +" downloaded out of "+nbVideos)
		if(nbDownloaded == nbVideos) {
			onMusicDownloaded(destDirectory)
		}
	}
}

function onMusicDownloaded(dir) {
	if(dir.substring(0, 2) == './') {
		dir = dir.substring(2)
	}
	var zipName = "musics.zip"
	var localPath = dir + zipName

	var zip = new Zipper()
	var files = fs.readdirSync(dir)
	console.log(files.length +" files!")
	/*for(var i in files) {
		console.log("adding %s", files[i])
		console.log(zip.addLocalFile.toString())
		zip.addLocalFile(files[i], localPath)
	}*/
	zip.addLocalFolder(dir)
	zip.writeZip(localPath)
	var host = AppSettings.host(port)
	var id = dir.slice(0, -1).split('/').slice(-1)[0]
	console.log(host)
	socket.emit("done", host + "dl/"+id)
	
}