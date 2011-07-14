var http = require('http')
io = require('socket.io')
ejs = require('ejs')
fs = require('fs')
url_module = require('url')

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
			//console.log(prop)
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

log_clients = function()
{
	s= "[ "
	for (client in listener.clients)
	{
		if (!clients_attached_at[client]) clients_attached_at[client]=new Date().getTime();
		if (listener.clients[client]) s+=client+" ("+client_attached_for(client) + ") "
	}
	s+="] "
	s+=Path
	console.log(s)
}

setInterval(function()
{
	log_clients()
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



server = http.createServer(function(request, response) 
{
  shim = generate_shim(request)     
  var proxy = http.createClient(80, request.headers['host'])
  request_headers = request.headers
  request_headers['Accept-Encoding']=''
  request_headers['accept-encoding']=''

  _path = "http://"+request.headers['host']+request.url;
  console.log("+++ "+_path)
  //for (property in request.headers) h+=(property + ":" +request.headers[property]+"")
  shim_added=false;	
  var proxy_request = proxy.request(request.method, request.url, request_headers);
  proxy_request.addListener('response', function (proxy_response) { 
    proxy_response.addListener('data', function(chunk) 
	{
  	console.log("chunk: "+chunk.length)
	  if (!shim_added && ready_for_text_html(request,_path))
	{
		_path = "http://"+request.headers['host']+request.url;
		if (is_html(proxy_response)) 
		{
		  Path=_path
		  valid_paths[Path]=true
		  console.log(Path+" is accepted html.")
//		  listener.broadcast(Path);
		  last_text_html_request_time = new Date().getTime();
		  if (typeof chunk=='undefined') chunk='';
		  chunk=shim+chunk;
		  shim_added=true;
		  //setInterval(function(){Shim_added=false;console.log("reset shim_added")},5000)
		}
		else
		{
			s=""
			for (i=0;i<shim.length;++i) s+=" "
			chunk=shim+s
		}
	}
      response.write(chunk, 'binary');
    });

    proxy_response.addListener('end', function() {
	  //if (!shim_added && ready_for_text_html(_path)) chunk = handle_data(request,proxy_response,_path)
		response.end();
    });
	headers = proxy_response.headers
	  //if (Path) console.log(new Date().getTime()/1000 +" Path is "+ Path)
	  if (
		((proxy_response.headers['connection']||proxy_response.headers['Connection'])=='keep-alive')
		) 
	  {
		console.log(_path+" blocked, returning 404.")
		response.statusCode = 404;
		response.end();
		return;
	  }
 
	  if (typeof(Path)!='undefined'&&Path!=null&&is_html(proxy_response)) // don't load any htmls outside the domain
	  {
		if (Path.substring(0,7)!='http://') Path='http://'+Path
		requested_host = url_module.parse(Path)['hostname']
		page_host = request.headers['host']
		if (!timeout_expired() && requested_host!=page_host&&is_html(proxy_response))
		{
			console.log(requested_host + " & " + page_host + " don't match, returning 404.")
			response.statusCode = 404;
			response.write("timeout still active, try again in "+time_til_end_of_timeout()+" seconds.")
			response.end();
			return;
		}
	  }
	if (is_html(proxy_response)) headers['content-length']=parseInt(headers['content-length'])+shim.length; 
    response.writeHead(proxy_response.statusCode, headers);
  });
  request.addListener('data', function(chunk) {
    proxy_request.write(chunk, 'binary');
  });
  request.addListener('end', function() {
    proxy_request.end();
  });
});

server.listen(3128);

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
		console.log('!!!!!!!!!!!!!!! message:' + s);
		Path = s
		listener.broadcast(Path) ;
		log_clients();
	}) 
	client.on('disconnect', function(l)
	{ 
		console.log('disconnect'); 
	}) 
});


