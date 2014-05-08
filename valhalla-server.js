var environments = {
	local : {
		client : 'http://valhalla-client/'
	},
	dev : {
		client : 'http://www.tomdanvers.com/labs/valhalla/'
	}
}

var environment = environments.local;


// Express App Setup
var express = require('express'),
	fs = require('fs'),
	app = express();

app.use(express.logger());

app.get('/', route);
app.get('/*', route);

function route(request, response) {
	switch(request.url){
		case '/settings.json':
			response.setHeader('Access-Control-Allow-Origin', '*');
		    	response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
		    	response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

		    	// intercept OPTIONS method
		    	if ('OPTIONS' == request.method) {
		     	response.send(200);
		    	}
		    	else {
		     	response.send(JSON.stringify(Settings));
		    	}

			//response.header('Access-Control-Allow-Origin', '*');
			//response.header('Access-Control-Allow-Headers', 'X-Requested-With');
			break;
		default:
			response.redirect(environment.client);
			break;
	}
}

var port = process.env.PORT || 8080;

console.log('Starting Valhalla on port '+port);
// Multi User
var io = require('socket.io').listen(app.listen(port, function() {
  console.log('Welcome to Valhalla on port ' + port);
}), {log:false});


//--------------------------------------------------------------
//------------------------------------------------------SETTINGS
//--------------------------------------------------------------

var Settings = {
	map : JSON.parse(fs.readFileSync('valhalla-map/valhalla-map.json', encoding="ascii")),
	player : {
		width:80,
		height:100
	}
};

//--------------------------------------------------------------
//----------------------------------------------------------TIME
//--------------------------------------------------------------
var Time = function() {

};

Time.prototype = {};
Time.prototype.constructor = Time;

Time.prototype.start = function(updateHandler, updateHandlerContext) {
	this.updateHandler = updateHandler;
	this.updateHandlerContext = updateHandlerContext;
	this.frequency = 10;
	this.previous = new Date().getTime();

	var that = this;
	this.interval = setInterval(function(){ that.update(); }, this.frequency);
};

Time.prototype.update = function() {
	this.current = new Date().getTime();
	var delta = this.current - this.previous;
	this.updateHandler.call(this.updateHandlerContext, delta/1000);
	this.previous = this.current;
};

//--------------------------------------------------------------
//--------------------------------------------------------PLAYER
//--------------------------------------------------------------

var Player = function(id, npc) {
	var pixelsPerMetre = 32;
	this.model = {id:id, x:0, y:0, prewviousX:0, previousY:0, colour:Math.floor(0xFFFFFF*Math.random())};
	this.input = {up:false, down:false, left:false, right:false};
	this.velocityMax = {x:10*pixelsPerMetre, y:25*pixelsPerMetre};
	this.velocity = {x:0, y:0};
	this.accelerationMax = {x:128*pixelsPerMetre, y:64*pixelsPerMetre};
	this.acceleration = {x:0, y:this.accelerationMax.y};
	this.width = 80;
	this.height = 100;
	this.grounded = false;

	if(npc){
		this.update = function(){
			if(Math.random() < 0.01) this.input.left = !this.input.left;
			if(Math.random() < 0.01) this.input.right = !this.input.right;
			if(Math.random() < 0.01) this.input.up = !this.input.up;

		}
	}else{
		this.update = function(){

		}
	}
};

Player.prototype = {};
Player.prototype.constructor = Player;

//--------------------------------------------------------------
//-----------------------------------------------------------MAP
//--------------------------------------------------------------

var Map = function(data) {
	this.data = data;
	this.width = this.data.width;
	this.height = this.data.height;
	this.tileWidth = data.tilewidth;
	this.tileHeight = this.data.tileheight;
	this.widthPx = this.width*this.data.tilewidth;
	this.heightPx = this.height*this.data.tileheight;

	this.layersMap = {};

	this.floor = this.getLayer('floor');

	this.floorColumns = [];
	for(var i = 0; i < this.width; i ++){
		this.floorColumns[i] = [];
		for(var j = 0; j < this.height; j ++){
			if(this.floor.data[j*this.width + i] != 0) this.floorColumns[i][j] = this.floor.data[j*this.width + i];
		}
	}
};

Map.prototype = {};
Map.prototype.constructor = Map;

Map.prototype.getLayer = function(id){
	if(this.layersMap[id] === undefined){
		for (var i = this.data.layers.length - 1; i >= 0; i--) {
			if(this.data.layers[i].name === id) this.layersMap[id] = this.data.layers[i];
		};
	}

	return this.layersMap[id];
};

Map.prototype.getFloorTile = function(x, y){
	x = Math.floor(x/this.tileWidth);
	y = Math.floor(y/this.tileHeight);
	return this.floor.data[y*this.width + x];
};

Map.prototype.getFloorColumn = function(x){
	x = Math.floor(x/this.tileWidth);
	return this.floorColumns[x];
};

//--------------------------------------------------------------
//----------------------------------------------------------GAME
//--------------------------------------------------------------

var Game = function() {

};

Game.prototype = {};
Game.prototype.constructor = Game;

Game.prototype.init = function(io, map, time) {
	this.io = io;
	this.io.debug = false;

	this.map = map;

	this.time = time;
	this.time.start(this.updateHandler, this);

	this.players = [];
	this.playersMap = {};

	this.world = {left:0, right:this.map.widthPx, top:0, bottom:this.map.heightPx, gravity:2000};

	this.data = {
		players:[]
	};

	var npcCount = 25;
	while(npcCount > 0){
		this.playerAdd(npcCount, true);
		npcCount --;
	}

	var that = this;
	io.sockets.on('connection', function(socket){
		that.playerAdd(socket.id, false);
		socket.on('commands', function(commands){
			that.commandsHandler(socket.id, commands);
		});
		socket.on('disconnect', function(){
			that.disconnectionHandler(socket.id);
		});
	});
};

Game.prototype.disconnectionHandler = function(id) {
	this.playerRemove(id);
};

Game.prototype.commandsHandler = function(id, commands) {
	var player = this.playerGet(id),
		commandCount = commands.data.length,
		command;

	if(player.commandTime > commands.time) return;

	for (var i = commandCount - 1; i >= 0; i--) {
		command = commands.data[i].split('-');
		if(command.length > 0){
			if(command[0] == 'u'){
				this.inputUp(player, parseInt(command[1]));
			}else if(command[0] == 'd'){
				this.inputDown(player, parseInt(command[1]));
			}
		}
	};
	player.commandTime = commands.time;
};

Game.prototype.inputDown = function(player, keyCode) {
	switch(keyCode){
		case 37://L
			player.input.left = true;
			break;
		case 38://U
			player.input.up = true;
			break;
		case 39://R
			player.input.right = true;
			break;
		case 40://D
			player.input.down = true;
			break;
	}
	//console.log(player.input);
};

Game.prototype.inputUp = function(player, keyCode) {
	switch(keyCode){
		case 37://L
			player.input.left = false;
			break;
		case 38://U
			player.input.up = false;
			break;
		case 39://R
			player.input.right = false;
			break;
		case 40://D
			player.input.down = false;
			break;
	}
	//console.log(player.input);
};

Game.prototype.playerAdd = function(id, npc) {
	var player = new Player(id, npc);
	this.players.push(player);
	this.playersMap[id] = player;
	this.data.players.push(player.model);

	this.playerCount = this.players.length;
};

Game.prototype.playerRemove = function(id) {
	var index;
	var player = this.playerGet(id);

	delete this.playersMap[id];
	index = this.players.indexOf(player);
	this.players.splice(index, 1);

	index = this.data.players.indexOf(player.model);
	this.data.players.splice(index, 1);

	this.playerCount = this.players.length;
};

Game.prototype.playerGet = function(id){
	return this.playersMap[id];
};

Game.prototype.updateHandler = function(timeDelta) {

	for (var i = this.playerCount - 1; i >= 0; i--) {
		this.player = this.players[i];
		this.player.update();

		// INPUT X
		if(this.player.input.left || this.player.input.right){
			var accelMultiplier = this.player.grounded ? 1 : .25;
			this.player.acceleration.x = this.player.input.left ? -this.player.accelerationMax.x*accelMultiplier : this.player.accelerationMax.x*accelMultiplier;
		}else{
			this.player.acceleration.x = 0;
			if(this.player.grounded){
				this.player.velocity.x *=.7;
			}else{
				this.player.velocity.x *=.99;
			}
		}

		// VELOCITY X
		this.player.velocity.x += this.player.acceleration.x*timeDelta;
		this.player.velocity.x = constrain(this.player.velocity.x, this.player.velocityMax.x);

		// POSITION X
		this.playerX = this.player.model.x += this.player.velocity.x*timeDelta;
		if(this.playerX < this.world.left){
			this.player.model.x = this.world.left;
			this.player.velocity.x *= -.5;
		}else if(this.playerX > this.world.right - this.player.width){
			this.player.model.x = this.world.right - this.player.width;
			this.player.velocity.x *= -.5;
		}else{
			this.player.model.x = this.playerX;
		}

		// INPUT Y
		if(this.player.grounded){
			if(this.player.input.up){
				this.player.velocity.y = -this.player.velocityMax.y;
				this.player.acceleration.y = this.world.gravity;
				this.player.grounded = false;
			}

			if(this.player.input.down){
				this.player.acceleration.y = this.world.gravity;
				this.player.grounded = false;
			}
		}

		// VELOCITY Y
		this.player.velocity.y += this.player.acceleration.y*timeDelta;

		// POSITION Y
		this.playerY = this.player.model.y + this.player.velocity.y*timeDelta;

		var collidedAtPx = this.collisionDetectionFloor(this.player, this.playerY + this.player.height);
		var collidedAtTile = Math.floor(collidedAtPx/32);
		if(collidedAtPx == -1 || (this.player.input.down && collidedAtPx/32 < 30)){
			this.player.model.y = this.playerY;
			this.player.acceleration.y = this.world.gravity;
			this.player.grounded = false;
		}else{
			this.player.model.y = collidedAtPx - this.player.height;
			this.player.velocity.y = this.player.acceleration.y = 0;
			this.player.grounded = true;
		}

		this.player.bottom = this.player.model.y + this.player.height;

		function constrain(val, maxVal) {
			if(val > maxVal){
				return maxVal;
			}else if(val < -maxVal){
				return -maxVal;
			}else{
				return val;
			}
		}
	};


	io.sockets.emit('update', {time:this.time.current, data:this.data});
};

Game.prototype.collisionDetectionFloor = function(player, playerNewY) {

	if(player.velocity.y < 0) return -1;

	var columnsToCheck = [];
	columnsToCheck.push(this.map.getFloorColumn(player.model.x));
	columnsToCheck.push(this.map.getFloorColumn(player.model.x+player.width));

	var columnsToCheckCount = columnsToCheck.length;
	var yPx;
	for (var i = 0; i < columnsToCheckCount; i++) {
		for(var y in columnsToCheck[i]){
			yPx = y*this.map.tileHeight;
			if(player.bottom < yPx && playerNewY > yPx) {
				return yPx;
			}else if(player.bottom === yPx){
				return yPx;
			}
		}
	};

	return -1;
};

//--------------------------------------------------------------
//----------------------------------------------------------INIT
//--------------------------------------------------------------

var time = new Time();

var map = new Map(Settings.map);

var game = new Game();
game.init(io, map, time);