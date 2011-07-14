var http = require('http')
httpProxy = require('http-proxy');
io = require('socket.io')
ejs = require('ejs')
fs = require('fs')
url_module = require('url')
var nodeio = require('node.io');
//var options = {timeout: 10};

var set_string = 's:33t'
var set_regexp = /s\:33t$/
var attach_command_string = /attach/
var reset_command_string = /syncreset/


var home_url = "http://bostonglobe.com/sinker"

var homepage_urls = [
	{
		"label":'boston globe qa',
		"url":'http://qaedit.bostonglobe.com/BostonGlobe'
	},
	{
		"label":'filament group mocks',
		"url":'http://10.100.50.47/Boston-Globe/tmpl/'
	},
]

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
var Path=null;

var clients_attached_at={}

client_attached_for = function(client) {
	time = clients_attached_at[client]
	diff = new Date().getTime()-time
	return Math.floor(diff/1000)
}

setInterval(function()
{
	log_connections()
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

count_char = function(s,c)
{
	cnt =0
	for (i=0;i<s.length;++i) if (s[i]==c) cnt++;
	return cnt;
}

unique_browsers = {}

generate_browser_signature = function(req)
{
	ip = req.client.remoteAddress
	user_agent = req.headers['user-agent']
	return ip+" "+user_agent
}

_is_settable = function(req)
{
  // is this the first instance of this ip/useragent	combo in one hour?
  browser_signature = generate_browser_signature(req)
  last_request_from_this_browser = unique_browsers[browser_signature];
	unique_browsers[browser_signature] = new Date().getTime();
	if (!last_request_from_this_browser||(new Date().getTime()-(60*60*1000))>last_request_from_this_browser)
	{
		console.log("+++++++++++++++++++++++ SETTABLE: "+browser_signature+":"+unique_browsers[browser_signature])
		return true;
	}
	else
	{
//		console.log("--- not settable: "+browser_signature+":"+unique_browsers[browser_signature])
		return is_settable_by_url(req);
	} 
}

is_settable=function(req)
{
		url = req.url
		if (url.match(/json/)) 
		{
	//		console.log("url didn't match /s\:33t$/ => "+url)
			return false;
		}
	if (!url.match(/s\:33t$/)) 
	{
//		console.log("url didn't match /s\:33t$/ => "+url)
		return false;
	}
	if (url.match(/=http/)) 
	{
	//	console.log("found '=http' => "+url)
		return false;
	}
	if (count_char(url,'?')>1) 
	{
//		console.log("too many ?'s => "+url)
		return false
	}
	return true
}

attach_command = function(url) 
{
	m =  url.match(attach_command_string);
//	console.log(url+":"+attach_command_string+":"+m)
	return m;
}

reset_command = function(url) 
{
	
	m =  url.match(reset_command_string);
	n = url.match(/google/)
//	console.log(url+":"+attach_command_string+":"+m)
	return m;
}

function handle_reset(req,res)
{
	res.write("<script>top.location.href='"+home_url+"';</script>");
	res.end();
	return;
}

function homepage(req,res)	
{
	Path=home_url
	s=generate_shim(req)
	s+="<div style='font-family:Courier;color:red'>"
	s+='<h1 style="border-bottom:4px solid red"> Sinker </h1>'
	console.log(">> "+homepage_urls[0].url)
	for (i=0;i<homepage_urls.length;++i)
	{
		x=homepage_urls[i]
		for (obj in x) console.log(":"+obj.url)
		s+="<p><a href='"+x.url+"?"+set_string+"'>"+x.label+"</a></p>"
	}
	s+="</div>"
	res.write(s);
	res.end();
	return;
}

function handle_attach(req,res)
{
	//response.statusCode='300'
	if (!Path) 
	{
		handle_reset(req,res);
		return;
	}
	res.write("<script>top.location.href='"+Path+"'</script>");
	res.end();
	return;
}

server = http.createServer(function (req, res) 
{
//  for (property in req.headers) console.log(property + ":" +req.headers[property]+"")
	if (req.url=='/sinker')
	{
		console.log("showing homepage with shim.")
		homepage(req,res)
		return;
	}
  _path = "http://"+req.headers['host']+req.url;
	//if ((is_top_html_request || valid_paths[_path])&&!req.headers['referer']&&!excluded(req))
	url = req.url
//	insp_obj(query);
//	console.log("request for "+_path)
//	console.log("===="+url+"'"+url.match(attach_command))
	if (reset_command(url))
	{
		handle_reset(req,res);
		console.log("syncreset received.")
	}
	if (attach_command(url))
	{
		handle_attach(req,res);
		console.log("device attaching.")
	}
	
	if (is_settable(req))//&&ready_for_text_html(req,_path)) 
	{
		console.log("+++s3tting Path: "+_path)
		Path=_path
		console.log ("-----------------------------------")
		console.log (req.url+" gets shim")
		console.log ("-----------------------------------")
//		valid_paths[_path]=true
//	  is_top_html_request=false
//		setTimeout(function(){is_top_html_request=true;console.log("resetting is_top_html_request=true")},5000)
		shim_proxy(req,res);
		broadcast(Path)
	}
	else
	{
//		console.log (" %%%%%%%%%%%%%% no shim"+req.url)
	  var proxy = new httpProxy.HttpProxy();
		proxy.proxyRequest(req, res, 80, req.headers['host']);
	}
})

server.listen(3128);

shim_proxy = function(request,response)
{
	shim = "<meta name='viewport' content='user-scalable=no, width=device-width,initial-scale=1, minimum-scale=1, maximum-scale=1'/>"
	shim+="<script>globe.OAS=null</script>"
	shim += generate_shim(request)     
	var proxy = http.createClient(80, request.headers['host'])
	request_headers = request.headers
	request_headers['Accept-Encoding']=''
	request_headers['accept-encoding']=''

	_path = "http://"+request.headers['host']+request.url;
	var proxy_request = proxy.request(request.method, request.url, request_headers);
	proxy_request.addListener('response', function (proxy_response) 
	{ 
		console.log('initial response to: '+_path)
		shim_added=false;	
		var declared_content_length = 0
		var actual_content_length = 0
		proxy_response.addListener('data', function(chunk) 
		{
			if (!shim_added)
			{
				console.log("actually adding shim with size "+shim.length)
				chunk=shim+chunk;
				shim_added=true;
			}
			actual_content_length+=chunk.length
//			console.log("SHIM PAGE chunk: "+chunk.length+":"+actual_content_length+"/"+declared_content_length)
			response.write(chunk, 'binary');
		}); //addListener

		proxy_response.addListener('end', function() 
		{
			console.log("SHIM PAGE response end")
			response.end();
		});
//		console.log("SHIM PAGE adding headers")
		headers = proxy_response.headers
		declared_content_length = headers['content-length']=(parseInt(headers['content-length'])+shim.length); 
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
		//listener.broadcast(Path);jm
	}
	client.on('message', function(s) { 
		if (s)
		{
			console.log('!!!!!!!!!!!!!!! received message, broadcasting:' + s);
			Path=s
			broadcast(Path)//,client);
	}
		
	}) 
	client.on('disconnect', function(l)
	{ 
		console.log('disconnect'); 
	}) 
});

var broadcast_timeout = 5000;
var last_broadcast=null
broadcast = function(msg,sending_client)
{
	log_connections();
	if (!last_broadcast || new Date().getTime()-broadcast_timeout>last_broadcast)
	{
		if (msg) 
		{
			listener.broadcast(msg,sending_client) // don't broadcast to sending client
			console.log ("broadcasting "+msg)
			last_broadcast=new Date().getTime();
		}
	}
	else
	{
		//console.log("in timeout, no broadcast: "+last_broadcast+":"+new Date().getTime()+":"+broadcast_timeout)
	}
}

log_connections = function()
{
	s= "[ "
	for (client in listener.clients)
	{
		if (!clients_attached_at[client]) clients_attached_at[client]=new Date().getTime();
		if (listener.clients[client]) s+=client+" ("+client_attached_for(client) + ") "
//		if (msg&&listener.clients[client]) listener.clients[client].send(msg)
	}
	s+="] "
	s+=Path
	console.log(s)
}
