// Express App Setup
var express = require('express');
var fs = require('fs');
var app = express();

module.exports = function(config, clientURL) {

	// Return the config .json or just redirect to web client

	app.get('/', route);
	app.get('/*', route);

	function route(request, response) {
		switch(request.url){
			case '/config.json':
				response.setHeader('Access-Control-Allow-Origin', '*');
		    	response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
		    	response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

		    	if ('OPTIONS' == request.method) {
		     		response.send(200);
		    	} else {
		     		response.send(JSON.stringify(config));
		    	}
			break;
		default:
			response.redirect(clientURL);
			break;
		}
	}

	return app;

}
