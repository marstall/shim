/*
document.writeln('<h1>shim: <%=host%></h1>');
document.writeln("<div style='color:black'>headers")
document.writeln('url: <%=url%>')
document.writeln("</div>")
document.writeln("<div style='color:black'>headers")
document.writeln('path: <%=path%>')
document.writeln("</div>")
document.writeln("<div style='color:black'>headers")
document.writeln('<%=h%>')
document.writeln("</div>")
*/
/*
broadcast = function(msg)
{
	if (!msg) msg=Path
	if (msg==null) return
	//if (msg!=screensaver_url) setTimeout(function() {broadcast(screensaver_url)},60000);
	if (clients) 
	{
		console.log("broadcast:")
//		insp_array(clients);
	}
	else
	{
		clients = Array.new
		console.log("can't broadcast, no clients")
	}
	for (client in clients)
	{
//		console.log("client.request")
//		insp_obj(clients[client]['request'])
//		console.log("client.headers")
//		console.log(clients[client]['headers'])
		if (!clients[client]) continue
		try
		{
			console.log("sending message to client "+clients[client]['sessionId']+": "+msg)
			clients[client].send(msg)
		}
		catch(err)
		{
			console.log ("!!!"+err);
		}
	}
}

var insp_array = function(objs)
{
	console.log('size:'+objs.length)
	for (obj in objs)
	{
		count =0
		insp_obj(objs[obj])
	}
}

count = 0
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

clients = [] ;

screensaver_url='http://www.boston.com'

remove = function(array,e) 
{
	if (array)
	{
		for (var i = 0; i < array.length; i++) 
		{
			if (e == array[i]) { return array.splice(i, 1); }
		}
	}
};
*/
$("#log").append("<div><span style='color:gray'>"+new Date().getTime()/1000+"</span>&nbsp;"+status+"</div>")
<!--<script src='http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js'></script> -->
