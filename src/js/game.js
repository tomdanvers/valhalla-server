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

	var npcCount = environment.npcCount;
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
		case 32://SPACE
			player.input.space = true;
			break;
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
	//console.log(keyCode);
};

Game.prototype.inputUp = function(player, keyCode) {
	switch(keyCode){
		case 32://SPACE
			player.input.space = false;
			break;
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
};

Game.prototype.playerAdd = function(id, npc) {
	var player = new Player(id, npc);
	player.model.x = (this.map.widthPx-Settings.player.width)*Math.random();
	player.model.y = player.height;

	this.players.push(player);
	this.playersMap[id] = player;
	this.data.players.push(player.model);

	this.playerCount = this.players.length;
};
Game.prototype.getRandomTarget = function(player) {

	var count = this.playerCount - 1;
	var target = null;
	while(count > 0) {
		target = this.players[Math.floor(this.playerCount * Math.random())];
		if (target === player || !target.isAlive) {
			target = null;
		} else {
			count = 0;
		}
		count --;
	}
	return target;
}

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
		if(this.player.isAlive){
			this.player.update();

			// TARGET
			if (this.player.isNPC && this.player.target === null && Math.random() > .8) {
				this.player.target = this.getRandomTarget(this.player);
				if (this.player.target) {
					console.log(this.player.model.id, 'has new target', this.player.target.model.id);
				}
			} else if (this.player.isNPC && this.player.target) {
				if (this.player.target.isAlive) {
					var diff = this.player.target.model.x - this.player.model.x;

					if (diff < 0) {
						this.player.input.left = true;
						this.player.input.right = false;
					} else if (diff > 0) {
						this.player.input.left = false;
						this.player.input.right = true;
					} else {
						this.player.input.left = false;
						this.player.input.right = false;
					}
				} else {
					this.player.target = null;
				}
			}

			// INPUT X
			var accelMultiplier = this.player.grounded ? 1 : .25;
			if(this.player.input.left && this.player.velocity.x > -this.player.velocityMax.x){
				this.player.acceleration.x = -this.player.accelerationMax.x*accelMultiplier;
			}else if(this.player.input.right && this.player.velocity.x < this.player.velocityMax.x){
				this.player.acceleration.x = this.player.accelerationMax.x*accelMultiplier;
			}else{
				this.player.acceleration.x = 0;
				if(this.player.grounded){
					this.player.velocity.x *=.7;
				}else{
					this.player.velocity.x *=.99;
				}
			}

			if(this.player.input.left){
				this.player.model.facing = -1;
			}else if(this.player.input.right){
				this.player.model.facing = 1;
			}

			// VELOCITY X
			this.player.velocity.x += this.player.acceleration.x * timeDelta;

			// POSITION X
			this.playerX = this.player.model.x += this.player.velocity.x * timeDelta;
			this.playerLeft = this.playerX - this.player.widthHalf;
			this.playerRight = this.playerX + this.player.widthHalf;
			if(this.playerLeft < this.world.left){
				this.player.model.x = this.world.left + this.player.widthHalf;
				this.player.velocity.x *= -.5;
			}else if(this.playerRight > this.world.right){
				this.player.model.x = this.world.right - this.player.widthHalf;
				this.player.velocity.x *= -.5;
			}else{
				this.player.model.x = this.playerX;
			}

			this.player.left = this.player.model.x - this.player.widthHalf;
			this.player.right = this.player.model.x + this.player.widthHalf;

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

			var collidedAtPx = this.collisionDetectionFloor(this.player, this.playerY);
			var collidedAtTile = Math.floor(collidedAtPx/32);
			if(collidedAtPx == -1 || (this.player.input.down && collidedAtPx/32 < 30)){
				this.player.model.y = this.playerY;
				this.player.acceleration.y = this.world.gravity;
				this.player.grounded = false;
			}else{
				this.player.model.y = collidedAtPx;
				this.player.velocity.y = this.player.acceleration.y = 0;
				this.player.model.levelY = this.player.model.y;
				this.player.grounded = true;
			}

			// ATTACK
			if(this.player.attackCooldown > 0){
				this.player.attackCooldown -= (timeDelta);
			}else if(this.player.attackCooldown <= 0 && this.player.input.space){
				this.playerAttacks(this.player);
			}

			function constrain(val, maxVal) {
				if(val > maxVal){
					return maxVal;
				}else if(val < -maxVal){
					return -maxVal;
				}else{
					return val;
				}
			}
		}else{
			this.player.isAlive = true;
			this.player.model.health = Settings.player.healthMax;
			this.player.model.x = (this.map.widthPx-Settings.player.width)*Math.random();
			this.player.model.y = this.player.height;
		}
	};


	io.sockets.emit('update', {time:this.time.current, data:this.data});
};


Game.prototype.collisionDetectionFloor = function(player, playerNewY) {

	if(player.velocity.y < 0) return -1;

	var columnsToCheck = [];
	columnsToCheck.push(this.map.getFloorColumn(player.left));
	columnsToCheck.push(this.map.getFloorColumn(player.right));

	var columnsToCheckCount = columnsToCheck.length;
	var yPx;
	for (var i = 0; i < columnsToCheckCount; i++) {
		for(var y in columnsToCheck[i]){
			yPx = y*this.map.tileHeight;
			if(player.model.y < yPx && playerNewY > yPx) {
				return yPx;
			}else if(player.model.y === yPx){
				return yPx;
			}
		}
	};

	return -1;
};

Game.prototype.playerAttacks = function(player) {

	var attackRight = player.model.facing > 0;
	var opponent;
	for (var i = this.playerCount - 1; i >= 0; i--) {
		opponent = this.players[i];
		if(opponent != player){
			if(opponent.model.x > player.model.x){
				if(attackRight){
					this.playerAttack(player, opponent);
				}
			}else {
				if(!attackRight){
					this.playerAttack(player, opponent);
				}
			}
		}
	}
	// player.velocity.x = 0;
	// player.acceleration.x = 0;
	player.attackCooldown = 1;
}

Game.prototype.playerAttack = function(player, opponent) {
	var diffX = player.model.x - opponent.model.x;
	var diffY = player.model.y - opponent.model.y;
	var distance;
	var damageMultiplier;
	if(Math.abs(diffX) < 150 && diffY < player.height && diffY > -player.height*.2){
		opponent.velocity.x = player.model.facing * 750;
		opponent.velocity.y = -400;
		
		player.velocity.x = -player.model.facing * 600;
		//distance = 150-Math.sqrt((diffX*diffX)+(diffY*diffY))
		//damageMultiplier = distance/150;

		opponent.model.health -= 5;
		if(opponent.model.health <= 0){
			this.death(opponent);
		}
	}
}

Game.prototype.death = function(player) {
	player.isAlive = false;
}