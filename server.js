var fs = require('fs');

require.extensions['.txt'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

var ASCII = require('./src/txt/ascii.txt');
var HTTP = require('./src/js/http');
var Game = require('./src/js/game');
var GameModeController = require('./src/js/controller/game-mode-controller');
var ConnectionController = require('./src/js/controller/connection-controller');


var CONFIG = {
	map : JSON.parse(fs.readFileSync('valhalla-map/valhalla-map.json', encoding="ascii")),
	player : {
		width:80,
		height:100,
		healthMax:25
	}
};

var ENVIRONMENTS = {
	local : {
		id:'local',
		client : 'http://valhalla-client/',
		npcCount : 10
	},
	dev : {
		id:'dev',
		client : 'http://valhalla.tomdanvers.com/',
		npcCount : 10
	}
};


var ENVIRONMENT = ENVIRONMENTS[process.argv[2]] === undefined ? ENVIRONMENTS.local : ENVIRONMENTS[process.argv[2]];

// Handles http requests to this server

var app = new HTTP(CONFIG, ENVIRONMENT.client);

// Start socket server

var port = process.env.PORT || 8080;

var io = require('socket.io')
    .listen(app.listen(port, function() {

        console.log(ASCII);
        console.log('Odin welcomes you to Valhalla on port ' + port);

        // Connections
        var connectionController = new ConnectionController(io, CONFIG, ENVIRONMENT);

        // Game Modes
        var gameModeController = new GameModeController(connectionController, CONFIG, ENVIRONMENT);
        gameModeController.next();

        // Create Game

        //var game = new Game(io, CONFIG, ENVIRONMENT);

    }));

