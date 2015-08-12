var fs = require('fs');

var HTTP = require('./src/js/http');



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
		npcCount : 5
	}
}


var environmentId = process.argv[2];
var environment = ENVIRONMENTS[environmentId] === undefined ? ENVIRONMENTS.local : ENVIRONMENTS[environmentId];

console.log('Valhalla environment "' + environment.id + '"');


// Handles http requests to this server

var app = new HTTP(CONFIG);

// Start socket server

var port = process.env.PORT || 8080;

console.log('Starting Valhalla on port '+port);

var io = require('socket.io').listen(app.listen(port, function() {
  console.log('Odin welcomes you to Valhalla on port ' + port);
}), {log:false});



// Game




