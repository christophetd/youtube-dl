var AppSettings = require('./AppSettings')
var fs 			= require('fs')

var handler = function(req, res, next) {
	var id = req.params.id
	var zipPath = AppSettings.tmpDir + id + '/' + AppSettings.zipName
	var regex = new RegExp("^[a-zA-Z0-9]{"+AppSettings.randomIdLength+"}$")
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
}

module.exports = handler;