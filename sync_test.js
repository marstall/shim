var http = require('http')
io = require('socket.io')
ejs = require('ejs')
fs = require('fs')

clients = [] ;

remove = function(array,e) {
  for (var i = 0; i < array.length; i++) {
    if (e == array[i]) { return array.splice(i, 1); }
  }
};

server = http.createServer(function(req, res){ 
 // your normal server code 
//	for (property in req.headers) console.log(property + " > " +req.headers[property])
//	broadcast();
	host = req.headers['host'];
	data={'host':host}
	tmpl = fs.readFileSync('views/client.ejs','utf8')
	var html = ejs.render(tmpl,data)
	res.end(html)
})

broadcast = function(msg)
{
	if (clients) console.log("broadcast:"+clients.length)
	for (client in clients)
	{
		if (!clients[client]) continue
		try
		{
			clients[client].send(msg)
		}
		catch(err)
		{
			console.log ("!!!"+err);
		}
	}
}

server.listen(8000);

// socket.io 
console.log('setting up listener ...') ;
var socket = io.listen(server);

load_html=function(url,cb)
{
	var options = {
		host: url,
		port: 80,
		path: '/',
		encoding: 'utf8',
		method: 'GET'
	};
	console.log('loading '+url)
	var req = http.request(options,function(res){
		console.log('got data')
	  	res.setEncoding('utf8');
		res.on('data',function(chunk) {
			//console.log(chunk)
			cb(chunk)
		});
	})
	req.end();
}

socket.on('connection', function(client){ 
	console.log('connect from client') 
	// new client is here! 
	if (clients)
	{
		console.log("pushing client onto array:"+client)
		clients.push(client)
		broadcast("a client connected");
	}
	else
	{
		console.log("clients is null")
	}
	client.on('message', function(s){ console.log('message:' + s);
		broadcast(s) 
		if (s.substring(0,3)=='www')
		{
			html = load_html(s,function(html) {
			console.log('got html of size '+html.length)
			broadcast(html)
			})
			
		}
	}) 
	client.on('disconnect', function(){ console.log('disconnect');
	 //clients = remove(clients,client) 
	}) 
});