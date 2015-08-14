var DeathMatch = require('./modes/death-match');
var TeamDeathMatch = require('./modes/team-death-match');

var Game = require('../game');

module.exports = function(connectionController, CONFIG, ENVIRONMENT) {

    var MODES = [DeathMatch];

    var api = {
        next: next
    };

    function next() {

        console.log('GameModeController.next()');

        var level = new Game(connectionController, CONFIG, ENVIRONMENT);

        var mode = new getRandom()(connectionController, level)
            .start()
            .done(function() {
                next();
            });

    }

    function getRandom() {
        return MODES[Math.floor(Math.random() * MODES.length)];
    }


    return api;
}
