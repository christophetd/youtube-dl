var AppSettings = {
	defaultPort: 8080, 
	defaultHost: "http://localhost", 
	randomIdLength: 16, 
	host: function(port) {
		return process.env.host || AppSettings.defaultHost + ":" + port + "/"
	}
}

module.exports = exports.AppSettings = AppSettings