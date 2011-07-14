var http = require('http'),  
io = require('socket.io'); // for npm, otherwise use require('./path/to/socket.io') 

console.log("start")

host = 'www.psychoastronomy.org' 
path = '/gtracka'


server = http.createServer(function(request, response) {
	for (property in request.headers) console.log(property + ":" +request.headers[property])
	//host = request.headers['host']
}).listen(3000);
  
// socket.io 

sync_server = http.createServer(function(request, response) {}).listen(3001);

var socket = io.listen(sync_server); 
socket.on('connection', function(client){ 
  // new client is here! 
  client.on('message', function(s){console.log("message:"+s)}) 
  client.on('disconnect', function(){}) 
});

/*
GET / HTTP/1.1
Host: www.tourfilter.com
User-Agent: Mozilla/5.0 (Windows;en-GB; rv:1.8.0.11) Gecko/20070312 Firefox/1.5.0.11
Accept: text/xml,text/html;q=0.9,text/plain;q=0.8,image/png;q=0.5
Accept-Language: en-gb,en;q=0.5
Accept-Encoding: gzip,deflate
Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.7
Keep-Alive: 300
Connection: keep-alive
Referer: http://localhost:3000
*/