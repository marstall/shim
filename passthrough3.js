var http = require('http')
httpProxy = require('http-proxy');
io = require('socket.io')
ejs = require('ejs')
fs = require('fs')
url_module = require('url')
var nodeio = require('node.io');
//var options = {timeout: 10};

insp_obj = function(obj,count)
{
	if (!count) count=0
	count=count+1;
	console.log(count)
	if (count>10)
	{
		console.log('too deep!')
	}
	
	for (prop in obj)
	{
		if (typeof(obj[prop])=='function')
		{
			console.log(prop)
		}
		else
		{
			o =obj[prop]
			console.log(prop+":"+o)
			
			//if (o) insp_obj(o,count)
		}
	}
}
var  count = 0
var Path="http://www.boston.com";

var clients_attached_at={}

client_attached_for = function(client) {
	time = clients_attached_at[client]
	diff = new Date().getTime()-time
	return Math.floor(diff/1000)
}

setInterval(function()
{
	log_clients(Path)
	},5000)

generate_shim = function(req)
{
	h=""
//	for (property in req.headers) h+=(property + ":" +req.headers[property]+"")
	//broadcast();
	host = req.headers['host'];
	url = req.url
	__path = host+url
	tmpl = fs.readFileSync('views/shim.ejs','utf8')
	var shim = ejs.render(tmpl)
	return shim;
}

String.prototype.rtrim = function() {
	return this.replace(/\s+$/,"");
}

is_html = function(response)
{
	ct = response.headers['content-type']
	if (!ct) return false;	
	tks = ct.split(';')
	tk1 = tks[0].trim();
//	console.log("+++ content-type:"+tk1+":")
	if ((tk1=='text/html') && (response.statusCode>=200&&response.statusCode<300)) return true
	else return false;
}

timeout = 15000 // milliseconds - ignore requests with referer in that time frame

last_text_html_request_time = null;
valid_paths = new Function();
// hack to prevent iframe-included text/html files from setting the canonical URL.
// basically, wait n seconds before prepending the shim.

time_til_end_of_timeout = function() {
	return Math.floor((new Date().getTime() - last_text_html_request_time)/1000);
}
timeout_expired = function() {
	return ((new Date().getTime()-last_text_html_request_time)>timeout)
}

ready_for_text_html = function(request,__path)
{
//	if (Path==_path) return true
//	if (url_module.parse(Path).hostname!=request.headers['host']) return false
	if (valid_paths[__path]==true) 
	{
		console.log('!! found in valid_paths: '+__path)
		return true;
	}
	else
	{
		//console.log('?? not found in valid_paths: '+_path)
	}
	if (last_text_html_request_time==null) return true;
	return timeout_expired();
}


var is_top_html_request=true;

excluded = function(req) {
	url = req.url
	if (url.match(/\.ico/)) return true ;
}

server = http.createServer(function (req, res) 
{
//  for (property in req.headers) console.log(property + ":" +req.headers[property]+"")
  _path = "http://"+req.headers['host']+req.url;
	//if ((is_top_html_request || valid_paths[_path])&&!req.headers['referer']&&!excluded(req))

	referer = req.headers['referer'];
	console.log(_path)
	if (!Path) Path=_path // if the server just started, or if the user clicked a bookmark
	if (_path==Path||(_path.match(/sh1m/)&&is_top_html_request))
	{
		if (!_path.match(/~attach/)) Path=_path
		console.log ("-----------------------------------")
		console.log (req.url+" gets shim")
		console.log ("-----------------------------------")
		valid_paths[_path]=true
		is_top_html_request=false
		setTimeout(function(){is_top_html_request=true;console.log("resetting is_top_html_request=true")},5000)
		shim_proxy(req,res);
	}
	else
	{
//		console.log (req.url+" no shim, referer is "+req.headers['referer'])
	  var proxy = new httpProxy.HttpProxy();
		proxy.proxyRequest(req, res, 80, req.headers['host']);
	}
})

server.listen(3128);

shim_proxy = function(request,response)
{
	shim = generate_shim(request)     
	var proxy = http.createClient(80, request.headers['host'])
	request_headers = request.headers
	request_headers['Accept-Encoding']=''
	request_headers['accept-encoding']=''

	_path = "http://"+request.headers['host']+request.url;
	shim_added=false;	
	var proxy_request = proxy.request(request.method, request.url, request_headers);
	proxy_request.addListener('response', function (proxy_response) 
	{ 
		proxy_response.addListener('data', function(chunk) 
		{
			if (!shim_added)
			{
				console.log("actually adding shim with size "+shim.length)
				chunk=shim+chunk;
				shim_added=true;
			}
			response.write(chunk, 'binary');
		}); //addListener

		proxy_response.addListener('end', function() 
		{
			response.end();
		});

		headers = proxy_response.headers
		headers['content-length']=parseInt(headers['content-length'])+shim.length; 
		response.writeHead(proxy_response.statusCode, headers);

	}); //addData



	request.addListener('data', function(chunk) 
	{
		proxy_request.write(chunk, 'binary');
	});

	request.addListener('end', function() 
	{
		proxy_request.end();
	});
}

console.log("server:"+server)


var listener = io.listen(server,{'timeout':600000});


// socket.io 
console.log('setting up listener ...') ;

listener.on('connection', function(client){ 
	if (client.request) 
	{
		console.log('connect from client.') 
		//listener.broadcast(Path);
	}
	client.on('message', function(s){ 
		if (s)
		{
			console.log('!!!!!!!!!!!!!!! received message, broadcasting:' + s);
			Path = s
//			listener.broadcast(Path) ; 
			log_clients(Path);
	}
		
	}) 
	client.on('disconnect', function(l)
	{ 
		console.log('disconnect'); 
	}) 
});

log_clients = function(msg)
{
	s= "[ "
	for (client in listener.clients)
	{
		if (!clients_attached_at[client]) clients_attached_at[client]=new Date().getTime();
		if (listener.clients[client]) s+=client+" ("+client_attached_for(client) + ") "
		if (msg&&listener.clients[client]) listener.clients[client].send(msg)
	}
	s+="] "
	s+=Path
	console.log(s)
//	listener.broadcast(msg)
}


