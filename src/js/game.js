var Map = require('./map');
var Time = require('./time');
var MappedList = require('./utils/mapped-list');
var Player = require('./player');

module.exports = function(io, config, environment) {

    var map = new Map(config.map);

    var players = new MappedList();

    var world = {
        left: 0,
        right: map.widthPx,
        top: 0,
        bottom: map.heightPx,
        gravity: 2000
    };

    var data = {
       players:[]
    };

    for(var i = 0; i < environment.npcCount; i ++){
        playerAdd(i, true);
    }

    var time = new Time();
    time.start(function(timeDelta) {

        update(timeDelta);

    });

    io.sockets.on('connection', function(socket){

        playerAdd(socket.id, false);

        socket.on('commands', function(commands){
			commandsHandler(socket.id, commands);
		});

		socket.on('disconnect', function(){
			disconnectionHandler(socket.id);
		});

	});

    function disconnectionHandler(id) {

    	playerRemove(id);

    }

    function commandsHandler(id, commands) {

        console.log('commandsHandler', id, commands)

        var player = players.get(String(id));

        var commandCount = commands.data.length;
    	var command;

    	if (player.commandTime > commands.time) {
            return;
        }

    	for (var i = commandCount - 1; i >= 0; i--) {
    		command = commands.data[i].split('-');
    		if(command.length > 0){
    			if(command[0] == 'u'){
    				inputUp(player, parseInt(command[1]));
    			}else if(command[0] == 'd'){
    				inputDown(player, parseInt(command[1]));
    			}
    		}
    	}

        player.commandTime = commands.time;

    }

    function inputDown(player, keyCode) {
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
    };

    function inputUp(player, keyCode) {
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

    function playerAdd(id, npc) {

    	var player = new Player(id, npc, config);
    	player.model.x = (map.widthPx - config.player.width) * Math.random();
    	player.model.y = player.height;

    	players.add(player);

        data.players.push(player.model);

    }

    function playerRemove(id) {

        var player = players.get(id);

        players.remove(player);

    	var index = data.players.indexOf(player.model);
    	data.players.splice(index, 1);

    }

    function getRandomTarget(player) {

        var count = players.count - 1;

        var target = null;
        while(count > 0) {
            target = players.getRandom();
            if (target === player || !target.isAlive) {
                target = null;
            } else {
                count = 0;
            }
            count --;
        }
        return target;

    }

    function update(timeDelta) {

        for (var i = players.count - 1; i >= 0; i--) {

            var player = players.get(i);

            if(player.isAlive){

    			// Target
    			if (player.isNPC && player.target === null && Math.random() > .99) {

                    // New target for this npc
    				player.target = getRandomTarget(player);

    			} else if (player.isNPC && player.target) {

    				if (player.target.isAlive) {

                        // Follow target
                        var diffX = player.target.model.x - player.model.x;
    					var diffY = player.target.model.y - player.model.y;

                        // console.log(diffX)

    					if (diffX < -25) {
    						player.input.left = true;
    						player.input.right = false;
    						player.input.space = false;
                        } else if (diffX > 25) {
                            player.input.left = false;
                            player.input.right = true;
                            player.input.space = false;
                        } else {
                            player.input.left = false;
                            player.input.right = false;
                            player.input.space = true;
    					}

                        if (diffY > 20) {
                            player.input.up = false;
                            player.input.down = true;
                        } else if (diffY < -20) {
                            player.input.up = true;
                            player.input.down = false;
                        } else {
                            player.input.up = false;
                            player.input.down = false;
                        }

    				} else {

                        // Clear target
    					player.target = null;

    				}

    			}

    			// Input X
    			var accelMultiplier = player.isGrounded ? 1 : .25;
    			if (player.input.left && player.velocity.x > -player.velocityMax.x) {
    				player.acceleration.x = -player.accelerationMax.x * accelMultiplier;
    			} else if(player.input.right && player.velocity.x < player.velocityMax.x) {
    				player.acceleration.x = player.accelerationMax.x * accelMultiplier;
    			} else{
    				player.acceleration.x = 0;
    				if(player.isGrounded){
    					player.velocity.x *=.7;
    				}else{
    					player.velocity.x *=.99;
    				}
    			}

    			if(player.input.left){
    				player.model.facing = -1;
    			}else if(player.input.right){
    				player.model.facing = 1;
    			}

    			// Velocity X
    			player.velocity.x += player.acceleration.x * timeDelta;

    			// Position X
    			playerX = player.model.x += player.velocity.x * timeDelta;
    			playerLeft = playerX - player.widthHalf;
    			playerRight = playerX + player.widthHalf;
    			if(playerLeft < world.left){
    				player.model.x = world.left + player.widthHalf;
    				player.velocity.x *= -.5;
    			}else if(playerRight > world.right){
    				player.model.x = world.right - player.widthHalf;
    				player.velocity.x *= -.5;
    			}else{
    				player.model.x = playerX;
    			}

    			player.left = player.model.x - player.widthHalf;
    			player.right = player.model.x + player.widthHalf;

    			// INPUT Y
    			if(player.isGrounded){
    				if(player.input.up){
    					player.velocity.y = -player.velocityMax.y;
    					player.acceleration.y = world.gravity;
    					player.isGrounded = false;
    				}

    				if(player.input.down){
    					player.acceleration.y = world.gravity;
    					player.isGrounded = false;
    				}
    			}

    			// VELOCITY Y
    			player.velocity.y += player.acceleration.y*timeDelta;

    			// POSITION Y
    			playerY = player.model.y + player.velocity.y*timeDelta;

    			var collidedAtPx = collisionDetectionFloor(player, playerY);
    			var collidedAtTile = Math.floor(collidedAtPx/32);
    			if(collidedAtPx == -1 || (player.input.down && collidedAtPx/32 < 30)){
    				player.model.y = playerY;
    				player.acceleration.y = world.gravity;
    				player.isGrounded = false;
    			}else{
    				player.model.y = collidedAtPx;
    				player.velocity.y = player.acceleration.y = 0;
    				player.model.levelY = player.model.y;
    				player.isGrounded = true;
    			}

    			// ATTACK
    			if(player.attackCooldown > 0){
    				player.attackCooldown -= (timeDelta);
    			}else if(player.attackCooldown <= 0 && player.input.space){
    				playerAttacks(player);
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
    			player.isAlive = true;
    			player.model.health = config.player.healthMax;
    			player.model.x = (map.widthPx - config.player.width) * Math.random();
    			player.model.y = player.height;
    		}
    	}

    	io.sockets.emit('update', {
            time: time.current,
            data: data
        });

    }


    function collisionDetectionFloor(player, playerNewY) {

    	if (player.velocity.y < 0) {
            return -1;
        }

    	var columnsToCheck = [];
    	columnsToCheck.push(map.getFloorColumn(player.left));
    	columnsToCheck.push(map.getFloorColumn(player.right));

    	var columnsToCheckCount = columnsToCheck.length;

        var yPx;
    	for (var i = 0; i < columnsToCheckCount; i++) {
    		for(var y in columnsToCheck[i]){
    			yPx = y * map.tileHeight;
    			if(player.model.y < yPx && playerNewY > yPx) {
    				return yPx;
    			}else if(player.model.y === yPx){
    				return yPx;
    			}
    		}
    	}

    	return -1;

    }

    function playerAttacks(player) {

    	var attackRight = player.model.facing > 0;
    	var opponent;

    	for (var i = players.count - 1; i >= 0; i--) {
    		opponent = players.get(i);
    		if(opponent != player){
    			if(opponent.model.x > player.model.x){
    				if(attackRight){
    					playerAttack(player, opponent);
    				}
    			}else {
    				if(!attackRight){
    					playerAttack(player, opponent);
    				}
    			}
    		}
    	}
    	// player.velocity.x = 0;
    	// player.acceleration.x = 0;
    	player.attackCooldown = 1;
    }

    function playerAttack(player, opponent) {

        var diffX = player.model.x - opponent.model.x;
    	var diffY = player.model.y - opponent.model.y;
    	var distance;
    	var damageMultiplier;
    	if(Math.abs(diffX) < 150 && diffY < player.height && diffY > -player.height*.2){
    		opponent.velocity.x = player.model.facing * 750;
    		opponent.velocity.y = -400;

    		player.velocity.x = -player.model.facing * 600;

    		opponent.model.health -= 5;
    		if(opponent.model.health <= 0){
    			death(opponent);
    		}
    	}
    }

    function death(player) {
        player.isAlive = false;
    }
}
