var Map = require('./map');
var Time = require('./time');
var Player = require('./player');
var Alliance = require('./alliance');

var CharacterUtils = require('./utils/character-utils');
var MappedList = require('./utils/mapped-list');


module.exports = function(connectionController, mapData, config) {

    var api = {
        maxLives: -1,
        changeState: changeState,
        addAlliances: addAlliances,
        addNPCs: addNPCs,
        getLiveCount: getLiveCount,
        setMaxLives: setMaxLives,
        initialiseConnections: initialiseConnections,
        onPlayerScored: onPlayerScored,
        onAllianceScored: onAllianceScored,
        destroy: destroy
    };

    var onPlayerScoredCallback = null;
    var onAllianceScoredCallback = null;

    var state;

    var map = new Map(mapData);

    var players = new MappedList('players');

    var alliances = new MappedList('alliances');

    // World definition
    var world = {
        left: 0,
        right: map.widthPx,
        top: 0,
        bottom: map.heightPx,
        gravity: 2000
    };

    // Deployment zones
    var viewportW = map.widthPx - config.player.width;
    var viewportHalfW = viewportW * .5;

    var DEPLOYMENT_ZONES = [
        {x: viewportHalfW * .1, width: viewportHalfW * .8},
        {x: viewportHalfW + viewportHalfW * .1, width: viewportHalfW * .8},
    ];

    // Data broadcasted to connected clients on update
    var sharedData = {
       players: []
    };

    // Start per frame updates
    var time = new Time();
    time.start(function(timeDelta) {

        update(timeDelta);

    });

    // WebSocket listeners / handlers
    function initialiseConnections() {

        // Existing Connections
        connectionController.input.each(function(socket) {
            connectionHandler(socket);
        });

        connectionController.both.each(function(socket) {
            connectionHandler(socket);
        });

        // New Connections
        connectionController.connection(function(socket) {

            if (socket.type === 'both' || socket.type === 'input') {

                connectionHandler(socket);

            }

        });

    }

    function connectionHandler(socket) {

        // console.log('Game.connectionHandler', socket.id);

        playerAdd(socket.id, socket.character, false);

        socket.on('commands', function(commands){
            commandsHandler(socket.id, commands);
        });

    }

    connectionController.disconnection(function(socket) {

        if (socket.type === 'both' || socket.type === 'input') {

            disconnectionHandler(socket);

        }

    });

    function disconnectionHandler(socket) {

        // console.log('Game.disconnectionHandler', socket.id);

        playerRemove(socket.id);

        // socket.off('commands');

    }

    function commandsHandler(id, commands) {

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

    function addAlliances() {
        // Arguments are array of alliance ids
        for (var i = 0; i < arguments.length; i++) {
            var deployment = DEPLOYMENT_ZONES[i];
            var alliance = new Alliance(arguments[i], deployment);
            alliances.add(alliance);
        }
    }

    function addNPCs(count) {
        for(var i = 0; i < count; i ++){
            playerAdd(i, CharacterUtils.getRandomCharacter(), true);
        }
    }

    function playerAdd(id, character, isNPC) {

    	var player = new Player(id, character, isNPC, config);
    	player.model.x = (map.widthPx - config.player.width) * Math.random();
    	player.model.y = player.height;
        player.model.lives = api.maxLives;

    	players.add(player);
        sharedData.players.push(player.model);

        if (alliances.count > 0) {

            var smallestAlliance = null;
            alliances.each(function(alliance) {
                if (smallestAlliance) {
                    smallestAlliance = smallestAlliance.players.count > alliance.players.count ? alliance : smallestAlliance;
                } else {
                    smallestAlliance = alliance;
                }
            });
            smallestAlliance.addPlayer(player);

            alliances.each(function(alliance) {
                if (alliance !== smallestAlliance) {
                    alliance.addEnemy(player);
                }
            });

        }

    }

    function playerRemove(id) {

        // console.log('Game.remove(',id,')');

        if (players.has(id)) {

            var player = players.get(id);

            players.remove(player);

        	var index = sharedData.players.indexOf(player.model);
        	sharedData.players.splice(index, 1);

        }

    }

    function getClosestTarget(player) {

        var enemies;
        if (player.alliance) {
            enemies = player.alliance.enemies;
        } else {
            enemies = players;
        }

        var count = enemies.count - 1;

        var target = null;
        var targetClosest = null;
        var distance;
        var distanceClosest = Number.MAX_VALUE;
        while(count > 0) {
            target = enemies.get(count);
            if (target !== player && target.isAlive) {
                distance = distanceBetween(target, player);
                if (distance < distanceClosest) {
                    distanceClosest = distance;
                    targetClosest = target;
                }
            }
            count --;
        }
        return targetClosest;

    }

    function distanceBetween(playerA, playerB) {

        var diffX = playerA.model.x - playerB.model.x;
        var diffY = playerA.model.y - playerB.model.y;
        return Math.sqrt(diffX*diffX + diffY*diffY);

    }

    function getRandomTarget(player) {

        var enemies;
        if (player.alliance) {
            enemies = player.alliance.enemies;
        } else {
            enemies = players;
        }

        var count = enemies.count - 1;

        var target = null;
        while(count > 0) {
            target = enemies.getRandom();
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

        if (state === 'match' || state === 'results') {

            players.each(function(player){ //START UPDATE

                if(player.isAlive){

        			// Target
        			if (player.model.isNPC && player.target === null && Math.random() > .9) {

                        // New target for this npc
                        if (Math.random() > .15) {
                            player.target = getClosestTarget(player);
                        } else {
        				    player.target = getRandomTarget(player);
                        }

                        if (player.target === null) {
                            player.clearInput();
                        }

        			} else if (player.model.isNPC && player.target) {

                        if (player.target.isAlive) {

                            var diffX = player.target.model.x - player.model.x;
        					var diffY = player.target.model.y - player.model.y;

                            // Follow target

        					if (diffX < -35) {
        						player.input.left = true;
        						player.input.right = false;
        						player.input.space = false;
                            } else if (diffX > 35) {
                                player.input.left = false;
                                player.input.right = true;
                                player.input.space = false;
                            } else {
                                if (player.model.facing === -1 && diffX > 0) {
                                    player.input.left = true;
                                } else {
                                    player.input.left = false;
                                }

                                if (player.model.facing === 1 && diffX < 0) {
                                    player.input.right = true;
                                } else {
                                    player.input.right = false;
                                }

                                player.input.space = true;
        					}

                            if (diffY > 40 && player.target.isGrounded && Math.random() > .9) {
                                player.input.up = false;
                                player.input.down = true;
                            } else if (diffY < -40 && player.target.isGrounded && Math.random() > .9) {
                                player.input.up = true;
                                player.input.down = false;
                            } else {
                                player.input.up = false;
                                player.input.down = false;
                            }

        				} else {

                            // Clear target
        					player.target = null;
                            player.clearInput();

        				}

                        if (Math.random() > .999) {
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

        			// Input Y
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

        			// Velocity Y
        			player.velocity.y += player.acceleration.y*timeDelta;

        			// Position Y
        			playerY = player.model.y + player.velocity.y*timeDelta;

        			var collidedAtPx = collisionDetectionFloor(player, playerY);
        			var collidedAtTile = Math.floor(collidedAtPx / 32);
        			if(collidedAtPx == -1 || (player.input.down && collidedAtPx / 32 < 30)){
        				player.model.y = playerY;
        				player.acceleration.y = world.gravity;
        				player.isGrounded = false;
        			}else{
        				player.model.y = collidedAtPx;
        				player.velocity.y = player.acceleration.y = 0;
        				player.model.levelY = player.model.y;
        				player.isGrounded = true;
        			}

        			// Attack
        			if(player.attackCooldown > 0){
        				player.attackCooldown -= timeDelta;
                        player.model.justAttacked = false;
                    }else if(player.attackCooldown <= 0 && player.input.space){
                        player.model.justAttacked = true;
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

        		}else if (player.model.lives === -1 || player.model.lives > 0){

        			respawn(player);

        		}

            }); //END UPDATE

            connectionController.emit('update', {
                time: time.current,
                data: sharedData
            });

        }

    }

    function respawn(player) {
        player.isAlive = true;
        player.model.health = config.player.healthMax;
        var viewportW = map.widthPx - config.player.width;
        if (player.alliance) {
            player.model.x = player.alliance.deployment.x + player.alliance.deployment.width * Math.random();
        } else {
            player.model.x = viewportW * .1 + viewportW * .8 * Math.random();
        }

        player.model.y = -player.height;
        player.velocity.x = 0;
        player.velocity.y = 0;
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

        player.model.justAttacked = true;

        var enemies;
        if (player.alliance) {
            enemies = player.alliance.enemies;
        } else {
            enemies = players;
        }

    	for (var i = enemies.count - 1; i >= 0; i--) {
    		opponent = enemies.get(i);
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

        if (player.isAlive && opponent.isAlive) {

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
                    // console.log('Warrior',player.model.id,'has score of',player.model.score);
                    death(opponent);

                    player.model.score ++;
                    playerScored(player, player.model.score);

                    if (player.alliance) {
                        player.alliance.score ++;
                        allianceScored(player.alliance, player.alliance.score);
                    }
        		} else if (Math.random() > .75) {
                    opponent.target = player;
                }
        	}

        }

    }

    function playerScored(player, score) {
        if (onPlayerScoredCallback) {
            onPlayerScoredCallback(player, score);
        }
    }

    function allianceScored(alliance, score) {
        if (onAllianceScoredCallback) {
            onAllianceScoredCallback(alliance, score);
        }
    }

    function death(player) {
        if (player.model.lives > 0) {
            player.model.lives --;
        }
        player.isAlive = false;
    }

    function changeState(newState) {

        if (newState === state) {
            return;
        }

        state = newState;

        switch(state) {
            case 'intro':
                players.each(function(player) {
                    player.model.score = 0;
                    respawn(player);
                });
                break;
            case 'match':
                break;
        }
    }

    function setMaxLives(value) {
        api.maxLives = value;
    }

    function getLiveCount() {

        var liveCount = 0;
        players.each(function(player) {
            if (player.model.lives === -1 || player.model.lives > 0) {
                liveCount ++;
            }
        });

        return liveCount;

    }

    function onPlayerScored(callback) {
        onPlayerScoredCallback = callback;
    }

    function onAllianceScored(callback) {
        onAllianceScoredCallback = callback;
    }

    function destroy() {
        time.stop();

        connectionController.connection(null);
        connectionController.disconnection(null);
    }

    return api;
}
