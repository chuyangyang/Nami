/*!
CTI 中间件
 *
 */

var app=require('express')();
var http=require('http').Server(app);
var io=require('socket.io')(http);
var url=require('url');
var http2=require('http');
var querystring=require('querystring'); 
var extenobj="";
var hy_extens = {};
var hy_socketid={};
var hy_workno={};
var  siptrunk="dx";
var httpdata = require('http');  
var res_json={};
//提交数据
function savedata(data)
{
	var content = querystring.stringify(data);
	var options = {  
   	 	hostname: '127.0.0.1',  
    		port: 80,  
    		path: '/huayi.php?' + content,  
    		method: 'GET'  
	};  
	var req = httpdata.request(options, function (res) {  
   		console.log('STATUS: ' + res.statusCode);  
   		console.log('HEADERS: ' + JSON.stringify(res.headers));  
   		res.setEncoding('utf8');  
    		res.on('data', function (chunk) {
        			console.log('BODY: ' + chunk);
    		});

	});  
  	req.on('error', function (e) {  
    		console.log('problem with request: ' + e.message);  
	});  
  	req.end();
}


var logger = require("log4js").getLogger('Nami.App');

var namiLib = require(__dirname + "/nami.js");


var namiConfig = {
    host: "127.0.0.1",
    port: 5038,
    username: "yintai",
    secret: "123456"
};
var nami = new namiLib.Nami(namiConfig);
process.on('SIGINT', function () {
    nami.close();
    process.exit();
});
nami.on('namiConnectionClose', function (data) {
    logger.debug('Reconnecting...');
    setTimeout(function () { nami.open(); }, 5000);
});

nami.on('namiInvalidPeer', function (data) {
	logger.fatal("Invalid AMI Salute. Not an AMI?");
	process.exit();
});
nami.on('namiLoginIncorrect', function () {
	logger.fatal("Invalid Credentials");
	process.exit();
});


nami.on('namiEventExtensionStatus', function (event) {
	var eventest=util.inspect(event);
	var obj2={'status':event.status,'type':'2','date':today()};
	var target=hy_extens[event.exten];
	console.log("state  exten "+event.exten);
	console.log("state  obj "+obj2);
	console.log("state  target "+target);

	if (target)
	{
		target.emit("login_sip/" + event.exten,obj2);
	}
	var data={'workno':hy_workno[event.exten],'exten':event.exten,'isforce':3,'d_type':2,'status':event.status};
	savedata(data);

});


nami.on('namiEventQueueMemberAdded', function (event) {

	var eventest=util.inspect(event);
	logger.debug('Got Event: ' + util.inspect(event));
	str=event.membername;
	var members= new Array();
	members=str.split("/");
	var obj2={'status':event.status,'queue':event.queue,'pause':event.paused,'type':'4','date':today()};
	var target=hy_extens[members[1]];
	if (target)
	{
		target.emit("login_" + event.membername,obj2);
	}
});


nami.on('namiEventQueueMemberRemoved', function (event) {
	str=event.membername;
	var members= new Array();
	members=str.split("/");
	logger.debug('Got Event--queue status: ' + members[0]);
	logger.debug('Got Event--queue name: ' + members[1]);
	var obj2={'status':'99','queue':event.queue,'type':'4','date':today()};
	var target=hy_extens[members[1]];
	if (target)
	{
	target.emit("login_" + event.membername,obj2);
	}
});


nami.on('namiEventQueueMemberPaused', function (event) {
	str=event.membername;
	var members= new Array();
	members=str.split("/");
	var obj2={'status':event.paused,'type':'3','date':today()};
	var target=hy_extens[members[1]];
	if (target)
	{
		target.emit("login_" + event.membername,obj2);
	}
});

nami.on('namiEventBridge', function (event) {

	logger.debug('Got Event--Bridge==============: ' + util.inspect(event));
	if(event.channel1.indexOf(siptrunk) == -1 )
	{
		channels=event.channel1.split("-");
		var extens=new Array();
		extens=channels[0].split("/");
		var obj2={'channel':event.channel1,'dstchannel':event.channel2,'type':'6','callerid1':event.callerid1,'callerid2':event.callerid2,'bridgestate':event.bridgestate,'date':today()};
		var target=hy_extens[extens[1]];
		if (target)
		{
			target.emit("login_sip/" + extens[1],obj2);
		}
	}
	if (event.channel2.indexOf(siptrunk)  == -1 )
	{
		channels=event.channel2.split("-");
		var extens=new Array();
		extens=channels[0].split("/");
		var obj2={'channel':event.channel1,'dstchannel':event.channel2,'type':'6','callerid1':event.callerid1,'callerid2':event.callerid2,'bridgestate':event.bridgestate,'date':today()};
		var target=hy_extens[extens[1]];
		if (target)
		{
			target.emit("login_sip/" + extens[1],obj2);
		}		
	}
});

nami.on('namiEventDial', function (event) {

	logger.debug('Got Event: ' + util.inspect(event));
	if (event.subevent=="Begin")
	{

		var channels= new Array();
		var callstatus=3;
		var  callee="";
		if(event.channel.indexOf(siptrunk) >= 0 )
		{
			callstatus=0;
			channels=event.destination.split("-");
			var extens=new Array();
			extens=channels[0].split("/");
			callee = event.calleridnum;
			var obj2={'channel':event.channel,'dstchannel':event.destination,'type':'5','calleridnum':callee,'callstatus':callstatus,'date':today()};
			var target=hy_extens[extens[1]];
			if (target)
			{
				target.emit("login_sip/" + extens[1],obj2);
			}
		}
		else if(event.destination.indexOf(siptrunk) >= 0)
		{
			callstatus=1;
			channels=event.channel.split("-");
			var extens=new Array();
			extens=channels[0].split("/");
			var dialcallee=new Array();
			dialcallee=event.dialstring.split("/");
			callee=dialcallee[1];
			var obj2={'channel':event.channel,'dstchannel':event.destination,'type':'5','calleridnum':callee,'callstatus':callstatus,'date':today()};
			var target=hy_extens[extens[1]];
			if (target)
			{
				target.emit("login_sip/" + extens[1],obj2);
			}
		}
		else
		{
			callstatus=0;
			dst_channels=event.destination.split("-");
			var dst_extens=new Array();
			dst_extens=dst_channels[0].split("/");
			callee=event.calleridnum;
			var obj2={'channel':event.channel,'dstchannel':event.destination,'type':'5','calleridnum':callee,'callstatus':callstatus,'date':today()};
			var target=hy_extens[dst_extens[1]];
			if (target)
			{
				target.emit("login_sip/" + dst_extens[1],obj2);
			}
			callstatus=1;
			src_channels=event.channel.split("-");
			var src_extens=new Array();
			src_extens=src_channels[0].split("/");
			callee=src_extens[1];
			var obj2={'channel':event.channel,'dstchannel':event.destination,'type':'5','calleridnum':callee,'callstatus':callstatus,'date':today()};
			var target=hy_extens[src_extens[1]];
			if (target)
			{
				target.emit("login_sip/" + src_extens[1],obj2);
			}
		}
	}
	else if(event.subevent=="End")
	{
		callstatus=0;
		end_channels=event.channel.split("-");
		var end_extens=new Array();
		end_extens=end_channels[0].split("/");
		var obj2={'channel':event.channel,'uniqueid':event.uniqueid,'type':'8','dialstatus':event.dialstatus,'callstatus':callstatus,'date':today()};
		var target=hy_extens[end_extens[1]];
		if (target)
		{
			target.emit("login_sip/" + end_extens[1],obj2);
		}
	}
});

nami.on('namiEventAgentCalled', function (event) {
	var members=new Array();
	members=event.agentname.split("/");
	var obj2={'caller':event.calleridnum,'type':'1'};
	var target=hy_extens[extens[1]];
	if (target)
	{
		target.emit("login_" + event.agentname,obj2);
	}
});

nami.on('namiEventHangup', function (event) {
	logger.debug('Got Event: ' + util.inspect(event));
	var eventest=util.inspect(event);
	var channels= new Array();
	channels=event.channel.split("-");
	var extens=new Array();
	extens=channels[0].split("/");
	var obj2={'channel':event.channel,'uniqueid':event.uniqueid,'type':'9','cause':event.cause,'cause_txt':event.cause_txt,'date':today()};
	var target=hy_extens[extens[1]];
	if (target)
	{
		target.emit("login_sip/" + extens[1],obj2);
	}
	logger.debug('Got Event--Hangup-uniqueid: ' + event.uniqueid);
	logger.debug('Got Event--Hangup-channel: ' + event.channel);
	logger.debug('Got Event--Hangup-calleridname: ' + event.calleridname);
	logger.debug('Got Event--Hangup-connectedlinename: ' + event.connectedlinename);
});

nami.on('namiEventCdr', function (event) {
	logger.debug('Got Event: ' + util.inspect(event));
	var eventest=util.inspect(event);
	var channels= new Array();
	if(event.channel.indexOf(siptrunk) >= 0 )
	{
		channels=event.destinationchannel.split("-");
		var extens=new Array();
		extens=channels[0].split("/");
		var filename="";
		filename='IN-'+event.source+"-"+event.uniqueid+".wav";
		logger.debug('Got Event--cdr-filename: ' + filename);			
		var workno=hy_workno[extens[1]];
		var obj2={'workno':workno,'source':event.source,'destination':event.destination,'type':'10','callerid':event.callerid,'channel':event.channel,'destinationchannel':event.destinationchannel,'starttime':event.starttime,'answertime':event.answertime,'endtime':event.endtime,'duration':event.duration,'billableseconds':event.billableseconds,'disposition':event.disposition,'uniqueid':event.uniqueid,'filename':filename,'date':today()};
		var target=hy_extens[extens[1]];
		console.log(today()+'======='+extens[1]);
		if (target)
		{
			target.emit("login_sip/" + extens[1],obj2);
		}
	}
	else
	{

		channels=event.channel.split("-");
		var extens=new Array();
		extens=channels[0].split("/");
		var dst_full=event.destination;
		var dst_len=dst_full.length;
		var dst_short=dst_full.substr(1,dst_len-1);
		var filename="";
		filename='OUT-'+dst_short+"-"+event.uniqueid+".wav";
		logger.debug('Got Event--cdr-filename: ' + filename);
		var workno=hy_workno[extens[1]];
		var obj2={'workno':workno,'source':event.source,'destination':event.destination,'type':'10','callerid':event.callerid,'channel':event.channel,'destinationchannel':event.destinationchannel,'starttime':event.starttime,'answertime':event.answertime,'endtime':event.endtime,'duration':event.duration,'billableseconds':event.billableseconds,'disposition':event.disposition,'uniqueid':event.uniqueid,'filename':filename,'date':today()};
		var target=hy_extens[extens[1]];
		console.log(today()+'===+==='+extens[1]);
		if (target)
		{
			target.emit("login_sip/" + extens[1],obj2);
		}
	}
	
	
	
});


function standardSend(action) {
    nami.send(action, function (response) {
	var extenstateobj={'type':'2','exten':response.exten,'status':response.status,'date':today()};
	var target=hy_extens[response.exten];
	if (target)
	{
		target.emit('login_sip/'+response.exten,extenstateobj);
	}
    });
}


nami.on('namiConnected', function (event) {
    standardSend(new namiLib.Actions.Ping());
});
nami.open();

function today()
{
	var today = new Date(); 
	var year = today.getFullYear();  
	var month = today.getMonth();  
	var date = today.getDate();  
	return year + '-' + month + '-' + date + "  " + today.toLocaleTimeString(); 
}


io.on('connection',function(socket){

	//登录
	socket.on('login',function(obj){
		console.log(today()+ '当前用户数量'+obj.isforce);
		if (typeof obj.isforce == 'undefined')
		{
			console.log(today()+obj.exten+'isforce参数不全');
			var obj2={'login':'error','exten':obj.exten,'info':'4','type':'7','socketid':socket.id,'date':today()};
			socket.emit('login_sip/'+obj.exten,obj2);
			return;
		}
		if (typeof obj.workno == 'undefined')
		{
			console.log(today()+obj.exten+'workno参数不全');
			var obj2={'login':'error','exten':obj.exten,'info':'4','type':'7','socketid':socket.id,'date':today()};
			socket.emit('login_sip/'+obj.exten,obj2);
			return;
		}
		var reg = new RegExp("^[0-9]{4}$");
 		if(reg.test(obj.exten)){
			console.log(today()+obj.exten+'数字');
			
			if (hy_extens[obj.exten])
			{
				logger.debug('当前用户存在：'+obj.exten);
				if (obj.isforce == "1")
				{
					var data={'workno':obj.workno,'exten':obj.exten,'issign':'1','isforce':obj.isforce,'d_type':0,'area':obj.area,'depart':obj.depart,'clientip':obj.clientip,'remark1':obj.remark1,'remark2':obj.remark2,'status':1000};
					var content = querystring.stringify(data);
					console.log(content);
					
					var options = {  
    							hostname: '127.0.0.1',  
					    		port: 80,  
					    		path: '/huayi.php?' + content,  
						  	method: 'GET'  
					};   
					var req = httpdata.request(options, function (res) {  
   							console.log('STATUS: ' + res.statusCode);  
   							console.log('HEADERS: ' + JSON.stringify(res.headers));  
   							res.setEncoding('utf8');
    							res.on("data", function(chunk){
								var res_arr= new Array();
								res_arr=chunk.split("|");
								
								var obj2={'login':'error','exten':obj.exten,'info':'3','type':'7','area':res_arr[0],'depart':res_arr[1],'loginip':res_arr[2],'workno':res_arr[4],'logintime':res_arr[5],'date':today()};
								socket.emit('login_sip/'+obj.exten,obj2);
								console.log("result logined user:"+chunk);
    							});

					});  
  					req.on('error', function (e) {  
    						console.log('problem with request: ' + e.message);  
					});  
  					req.end();

					//console.log("json:"+res_json);
					//var obj2={'login':'error','exten':obj.exten,'info':'3','type':'7','socketid':socket.id,'date':today()};
					//socket.emit('login_sip/'+obj.exten,obj2);
					return;
				}
				else if (obj.isforce =="2")
				{


					var data={'workno':obj.workno,'exten':obj.exten,'issign':'1','isforce':obj.isforce,'d_type':0,'area':obj.area,'depart':obj.depart,'clientip':obj.clientip,'remark1':obj.remark1,'remark2':obj.remark2,'status':1000};
					var content = querystring.stringify(data);
					console.log(content);
					var options = {  
    							hostname: '127.0.0.1',  
					    		port: 80,  
					    		path: '/huayi.php?' + content,  
						  	method: 'GET'  
					};   
					var req = httpdata.request(options, function (res) {  
   							console.log('STATUS: ' + res.statusCode);  
   							console.log('HEADERS: ' + JSON.stringify(res.headers));  
   							res.setEncoding('utf8');  
    							res.on('data', function (chunk) {
								var res1=chunk;
								console.log(chunk);
								if (chunk.indexOf("fail") >= 0)
								{
									console.log('2222222222222222hunk====' + res1);
	        								console.log('22222222222222222BODY: ' + res1);
									var obj2={'login':'fail','exten':obj.exten,'info':'6','type':'7','socketid':socket.id,'date':today()};
									//console.log(today()+obj.exten+'登录成功');
									socket.emit('login_sip/'+obj.exten,obj2);

								}
								else if (chunk.indexOf("success") >= 0)
								{	
									hy_socketid[socket.id]=obj.exten;
									show_userinfo(hy_socketid);
									hy_workno[obj.exten]=obj.workno;
									show_userinfo(hy_workno);
									hy_extens[obj.exten]=socket;
									show_userinfo(hy_extens);
					 				logger.debug('socket对象是：'+socket);
									var obj2={'login':'success','exten':obj.exten,'info':'1','type':'7','socketid':socket.id,'date':today()};
									console.log(today()+obj.exten+'登录成功');
									socket.emit('login_sip/'+obj.exten,obj2);
								}
								else
								{
								       console.log('2222222222222222hunk====' + res1);
                                                                                console.log('22222222222222222BODY: ' + res1);
                                                                        	       var obj2={'login':'fail','exten':obj.exten,'info':'6','type':'7','socketid':socket.id,'date':today()};
                                                                               //console.log(today()+obj.exten+'登录成功');
                                                                               socket.emit('login_sip/'+obj.exten,obj2);
								}
    							});

					});  
  					req.on('error', function (e) {  
    							console.log('problem with request: ' + e.message);  
					});  
  					req.end();

				}
				else
				{
					var obj2={'login':'error','exten':obj.exten,'info':'5','type':'7','socketid':socket.id,'date':today()};
					socket.emit('login_sip/'+obj.exten,obj2);
					return;
				}
			}
			else
			{
				var data={'workno':obj.workno,'exten':obj.exten,'issign':'1','isforce':obj.isforce,'d_type':0,'area':obj.area,'depart':obj.depart,'clientip':obj.clientip,'remark1':obj.remark1,'remark2':obj.remark2,'status':1000};
				var content = querystring.stringify(data);
				console.log(content);
				var options = {  
    						hostname: '127.0.0.1',  
				    		port: 80,  
				    		path: '/huayi.php?' + content,  
					  	method: 'GET'  
				};   
				var req = httpdata.request(options, function (res) {  
   							console.log('STATUS: ' + res.statusCode);  
   							console.log('HEADERS: ' + JSON.stringify(res.headers));  
   							res.setEncoding('utf8');  
    							res.on('data', function (chunk) {
								var res1=chunk;
								console.log(chunk);
								if (chunk.indexOf("fail") >= 0)
								{
									console.log('2222222222222222hunk====' + res1);
	        								console.log('22222222222222222BODY: ' + res1);
									var obj2={'login':'fail','exten':obj.exten,'info':'6','type':'7','socketid':socket.id,'date':today()};
									//console.log(today()+obj.exten+'登录成功');
									socket.emit('login_sip/'+obj.exten,obj2);

								}
								else if (chunk.indexOf("success") >= 0)
								{	
									hy_socketid[socket.id]=obj.exten;
									show_userinfo(hy_socketid);
									hy_workno[obj.exten]=obj.workno;
									show_userinfo(hy_workno);
									hy_extens[obj.exten]=socket;
									show_userinfo(hy_extens);
					 				logger.debug('socket对象是：'+socket);
									var obj2={'login':'success','exten':obj.exten,'info':'1','type':'7','socketid':socket.id,'date':today()};
									console.log(today()+obj.exten+'登录成功');
									socket.emit('login_sip/'+obj.exten,obj2);
								}
								else
								{
									                                                                        console.log('2222222222222222hunk====' + res1);
                                                                                console.log('22222222222222222BODY: ' + res1);
                                                                        	       var obj2={'login':'fail','exten':obj.exten,'info':'6','type':'7','socketid':socket.id,'date':today()};
                                                                               //console.log(today()+obj.exten+'登录成功');
                                                                               socket.emit('login_sip/'+obj.exten,obj2);
								}
    							});

				});  
  				req.on('error', function (e) {  
    						console.log('problem with request: ' + e.message);  
				});  
  				req.end();
	

			}
			
		}
		else
		{
			console.log(today()+obj.exten+'字母');
			var obj2={'login':'error','exten':obj.exten,'info':'2','type':'7','socketid':socket.id,'date':today()};
			socket.emit('login_sip/'+obj.exten,obj2);
		}
		
		
	
	});
	//签出
	socket.on('loginout',function(obj){
		var exten=hy_socketid[obj.socketid];
		console.log(today()+obj.exten+socket.id);
		if (hy_extens)
		{
			delete hy_extens[obj.exten];
			delete hy_socketid[obj.socketid]
			delete hy_workno[obj.workno];
			show_userinfo(hy_workno);
 			show_userinfo(hy_extens);
			var obj2={'loginout':'success','exten':obj.exten,'info':'1','type':'11','socketid':socket.id,'date':today()};
			socket.emit('login_sip/'+obj.exten,obj2);
		}
		var data={'workno':obj.workno,'exten':obj.exten,'isforce':3,'d_type':1};
		savedata(data);
	});
	//客户端保持长连接，测试消息 2016-1-21
	socket.on('clientconnect',function(obj){
		var target=hy_extens[obj.exten];
		console.log(today()+obj.exten+":"+socket.id);
		if (target)
		{
			var obj2={'clientping':'success','exten':obj.exten,'workno':obj.workno,'socketid':socket.id,'date':today()};
			target.emit("login_sip/" + obj.exten,obj2);
		}

	});
	//外呼
	socket.on('callout',function(obj){
	  	action = new namiLib.Actions.Originate();
		action.Channel = obj.Channel;
		action.Exten = obj.Exten;
		action.Priority = obj.Priority;
		action.Context= obj.Context;
		action.Timeout = obj.Timeout;
		action.CallerID = obj.CallerID;
		action.Async= obj.Async;
		action.Variable = " flag=call,workno="+obj.workno+",remark1="+obj.remark1+",remark2="+obj.remark2+",call1="+obj.call1+",call2="+obj.call2;
		standardSend(action);

	});
	//获取分机状态
	socket.on('extenstate',function(obj){
	  	action = new namiLib.Actions.ExtensionState();
		action.Exten = obj.exten;
		action.Context= "default";
		var res="";
		res=standardSend(action);
		//console.log("GET EXTEN STATUS:"+res.status);
	});

	//转接
	socket.on('mttranfer',function(obj){
	  	action = new namiLib.Actions.Redirect();
		action.Priority=1;
		action.Channel= obj.channel;
		action.Exten=obj.exten;
		action.Context=obj.context;
		var res="";
		res=standardSend(action);
	});

	//
	//挂机
	socket.on('mthangup',function(obj){
	  	action = new namiLib.Actions.Hangup();
		action.Channel= obj.channel;
		action.Cause= "shou dong hangup";
		var res="";
		res=standardSend(action);
	});
	//预测外呼签入
	socket.on('signin',function(obj){
		action = new namiLib.Actions.Command();
    		action.command = "queue add  member sip/"+obj.exten+" to  "+obj.queuename;
   		 standardSend(action);
	});
	//预测外呼签出
	socket.on('signout',function(obj){
		action = new namiLib.Actions.Command();
    		action.command = "queue remove member sip/"+obj.exten+" from "+obj.queuename;
   		 standardSend(action);
	});
	//队列中分机取消暂停状态
	socket.on('queueunpause',function(obj){
		action = new namiLib.Actions.Command();
    		action.command = "queue unpause member sip/"+obj.exten;
   		 standardSend(action);
	});

	//退出登录
	socket.on('disconnect', function(obj){
		console.log('receive disconnect event');
		if (hy_socketid)
		{
			console.log(socket.id+'离开'+"=========="+hy_socketid[socket.id]);
			var exten=hy_socketid[socket.id];
			var data={'workno':hy_workno[exten],'exten':exten,'issign':'3','isforce':obj.isforce,'d_type':1};
			console.log("离开:"+data);
			savedata(data);
			if (hy_extens)
			{
				delete hy_extens[exten];
				delete hy_socketid[socket.id]
				delete hy_workno[exten];
				show_userinfo(hy_workno);
				show_userinfo(hy_extens);
			}
		}
		});
});


//显示登录用户详细信息
function show_userinfo(userinfo){
	var ret='';
	var count=0;
	for(var i in userinfo)
	{
		ret+=i+':'+userinfo[i];
		count=count+1;
	}
	console.log('当前登录用户明细'+"==="+ret);
	console.log('当前登录用户数量'+"==="+count);
}

var initdata={'workno':'admin','d_type':4};
savedata(initdata);
http.listen(13001);
console.log('Server running at http://127.0.0.1:13001/');

http2.createServer(function(request,response){

   response.writeHead(200, { 'Content-Type': 'text/html' });
   var objectUrl=url.parse(request.url);
   console.log(objectUrl);
   var objectQuery=querystring.parse(objectUrl.query);
   io.emit('login'+objectQuery.dst,objectQuery);
  //io.emit('extenmonitor',objectQuery);
   console.log(objectQuery);
   response.write('<html><head></head><body>');
   response.write(objectQuery+'<br/>');
   response.end('</body></html>');
}).listen(13002);
console.log('Server running at http://127.0.0.1:13002/');


