var fs = require('fs');

require.extensions['.txt'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

var ASCII = require('./src/txt/ascii.txt');
var HTTP = require('./src/js/http');
var GameModeController = require('./src/js/controller/game-mode-controller');
var ConnectionController = require('./src/js/controller/connection-controller');

var mapDirRead = fs.readdirSync('valhalla-map');
var maps = [];
for (var i = 0; i < mapDirRead.length; i++) {
    if (mapDirRead[i].indexOf('.json') > -1) {
        var map = JSON.parse(fs.readFileSync('valhalla-map/' + mapDirRead[i], encoding="ascii"));
        map.id = mapDirRead[i];
        maps.push(map);
    }
}

var CONFIG = {
	maps : maps,
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

    }));

