var AppSettings 	= require('./AppSettings');
var express 		= require('express');
var app 			= express();
var server 			= require('http').Server(app);
var io 				= require('socket.io')(server);
var fs				= require('fs')
var socketHandler	= require('./socketHandler')
var downloadHandler = require('./downloadHandler')

var port = AppSettings.port()
server.listen(port);


app.get('/dl/:id', downloadHandler)
app.use(express.static(__dirname + '/static'));


io.on('connection', socketHandler)