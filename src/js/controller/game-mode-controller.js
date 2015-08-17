var DeathMatch = require('./modes/death-match');
var TeamDeathMatch = require('./modes/team-death-match');

var Level = require('../level');

module.exports = function(connectionController, CONFIG, ENVIRONMENT) {

    var MODES = [DeathMatch, TeamDeathMatch];

    var api = {
        next: next
    };

    function next() {

        var level = new Level(connectionController, CONFIG);

        var mode = new getRandom()(connectionController, level, ENVIRONMENT)
            .start()
            .done(next);

    }

    function getRandom() {
        return MODES[Math.floor(Math.random() * MODES.length)];
    }


    return api;
}
