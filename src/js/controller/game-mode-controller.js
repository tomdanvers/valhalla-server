var DeathMatch = require('./modes/death-match');
var TeamDeathMatch = require('./modes/team-death-match');
var LastManStanding = require('./modes/last-man-standing');
var TeamLastManStanding = require('./modes/team-last-man-standing');

var Level = require('../level');

module.exports = function(connectionController, CONFIG, ENVIRONMENT) {

    var MODES = [TeamLastManStanding, LastManStanding, DeathMatch, TeamDeathMatch];
    // var MODES = [DeathMatch];
    MODES.count = 0;
    MODES.random = false;

    var MAPS = CONFIG.maps;
    MAPS.count = 0;
    MAPS.random = false;

    var api = {
        next: next
    };

    function next() {

        var map = get(MAPS);

        connectionController.map = map.id;

        var level = new Level(connectionController, map, CONFIG);

        var mode = new get(MODES)(connectionController, level, ENVIRONMENT)
            .onChangeState(function(modeId, stateId, stateData) {

                // Let game objects know...

                connectionController.mode = modeId;
                connectionController.state = stateId;

                level.changeState(stateId);

                // Let clients know ...

                var payload = {
                    mode: modeId,
                    state: stateId,
                    map: map.id
                };

                // ... and pass through state specific data ...

                if (stateData !== undefined) {
                    for (var key in stateData) {
                        payload[key] = stateData[key];
                    }
                }

                connectionController.emit('mode:state:change', payload);
            })
            .start()
            .done(next);

    }

    function get(arr) {

        if (arr.random) {
            return getRandom(arr);
        } else {
            return getSequential(arr);
        }

    }

    function getRandom(arr) {

        return arr[Math.floor(Math.random() * arr.length)];

    }

    function getSequential(arr) {

        arr.count ++;
        if (arr.count === Number.MAX_VALUE - 1) {
            arr.count = 0;
        }
        return arr[arr.count % arr.length];

    }

    return api;
}
