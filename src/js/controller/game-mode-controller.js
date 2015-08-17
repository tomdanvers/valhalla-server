var DeathMatch = require('./modes/death-match');
var TeamDeathMatch = require('./modes/team-death-match');
var LastManStanding = require('./modes/last-man-standing');

var Level = require('../level');

module.exports = function(connectionController, CONFIG, ENVIRONMENT) {

    var MODES = [LastManStanding, DeathMatch, TeamDeathMatch];
    var RANDOM = false;
    var SEQUENTIAL_COUNT = -1;

    var api = {
        next: next
    };

    function next() {

        var level = new Level(connectionController, CONFIG);

        var mode = new getMode()(connectionController, level, ENVIRONMENT)
            .start()
            .done(next);

    }

    function getMode() {
        if (RANDOM) {
            return getRandom();
        } else {
            return getSequential();
        }
    }

    function getRandom() {
        return MODES[Math.floor(Math.random() * MODES.length)];
    }

    function getSequential() {
        SEQUENTIAL_COUNT++;
        if (SEQUENTIAL_COUNT === Number.MAX_VALUE - 1) {
            SEQUENTIAL_COUNT = 0;
        }
        return MODES[SEQUENTIAL_COUNT % MODES.length];
    }


    return api;
}
