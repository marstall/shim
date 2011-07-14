var http = require('http'),  
io = require('socket.io'), // for npm, otherwise use require('./path/to/socket.io') 

client_code = function(host,_path)
{
 return "<script src='http://"+host+"/socket.io/socket.io.js'></script> \
	<script src='http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js'></script> \
	<div style='padding:4px;background-color:#ffc;float:right;opacity:0.4'>path: "+_path+"</div><div style='clear:right'></div> \
	<script> \
		init = function() \
		{ \
			var host = '"+host+"'; \
			host = host.substring(0,host.indexOf(':')); \
			try \
			{ \
				var socket = new io.Socket(host,{port:8000,transports:['websocket', 'flashsocket', 'xhr-polling','htmlfile', 'xhr-multipart', 'jsonp-polling']}); \
				socket.connect(); \
				socket.on('message', function(data){alert(data);location.href=data});\
				socket.on('disconnect', function(){});\
			} \
			catch (err) \
			{ \
				alert(err); \
			} \
		}; \
		$(document).ready(function() { \
			init(); \
		}); \
	</script>"
}

var host_to_proxy = 'www.psychoastronomy.org'
var path = '/'
var old_path = null
var client = null
clients = [] ;

remove = function(array,e) {
  for (var i = 0; i < array.length; i++) {
    if (e == array[i]) { return array.splice(i, 1); }
  }
};

server = http.createServer(function(req, res){ 
 // your normal server code 
//	for (property in req.headers) console.log(property + " > " +req.headers[property])
 	console.log("requested file")
	host = req.headers['host'];
	console.log("host:" + host);
//	broadcast();
	append = client_code(host,req.url) 
	passthrough(req,res, append);
})

broadcast = function()
{
	if (path!=old_path)
	{
		console.log("broadcast:"+clients.length)
		for (client in clients)
		{
			if (!clients[client]) continue
			try
			{
				console.log("client:"+client)
				clients[client].send(path)
			}
			catch(err)
			{
				console.log ("!!!"+err);
			}
		}
	}
}

server.listen(8000);

// socket.io 
console.log('setting up listener ...') ;
var socket = io.listen(server);

passthrough = function(request,response,append)
{
	headers = request.headers
	headers['host']=host_to_proxy
	var proxy = http.createClient(80, host_to_proxy)
	old_path = path;
	path = request.url;
	console.log("path:"+path)
	var proxy_request = proxy.request(request.method, path, headers);

	proxy_request.addListener('response', function (proxy_response) 
	{
		//for (property in proxy_response.headers) console.log(property + ":" +proxy_response.headers[property])
		proxy_response.addListener('data', function(chunk) 
		{
			if (proxy_response.headers['content-type'].substring(0,4)=='text') 
			{
				console.log("path:"+path)
				console.log("content-type:"+proxy_response.headers['content-type'])
				response.write(append,'binary');
				append=''
			//	broadcast();
			}
			response.write(chunk, 'binary');
		});
		proxy_response.addListener('end', function() 
		{
			response.end();
		});
		headers = proxy_response.headers
		headers['content-length']=parseInt(headers['content-length'])+append.length
		response.writeHead(proxy_response.statusCode, headers);
		
	});

	request.addListener('data', function(chunk) 
	{
		proxy_request.write(chunk, 'binary');
	});

	request.addListener('end', function() 
	{
		proxy_request.end();
	});
}  

client=null
socket.on('connection', function(client){ 
	console.log('connect from client') 
	// new client is here! 
	if (clients)
	{
		console.log("pushing client onto array:"+client)
		clients.push(client)
		broadcast();
	}
	else
	{
		console.log("clients is null")
	}
/*	client.on('message', function(s)
	{ 
		client.send(path)
	}) 
	client.on('message', function(s){ console.log('message:' + s) }) */
	client.on('disconnect', function(){ console.log('disconnect'); clients = remove(clients,client) }) 
});