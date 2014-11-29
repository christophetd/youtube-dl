var AppSettings = {
	defaultPort: 8080, 
	defaultHost: "http://localhost", 
	randomIdLength: 16, 
	tmpDir: "tmp/", 
	zipName: "music.zip",
	downloadRoute: "dl/:id",
	defaultBitrate: 256,
	host: function() {
		var port 	= AppSettings.port()
		var portStr = port == 80 ? '' : ':' + port
		return (process.env.host || AppSettings.defaultHost) + portStr + '/'
	}, 
	port: function() {
		return process.env.PORT || AppSettings.defaultPort
	}
}

module.exports = exports.AppSettings = AppSettings