module.exports = function(connectionController, level) {

    var api = {
        start: start,
        done: done
    };

    var state;
    var doneCallback = null;

    // Initialisation

    level.addAlliances(['red', 'blue']);

    // Win Criteria

    var maxScore = 10;

    level.onAllianceScored(function(alliance, score) {

        // if (score >= maxScore) {
        //     level.onPlayerScored(null);
        //     console.log('TeamDeathMatch: Player', player.character.name, 'won with score of', score);
        //     endMatch({
        //         winner: player.character.name,
        //         score: score
        //     });
        // }

    });

    function changeState(newState, data) {

        state = newState;

        // Let game objects know...

        connectionController.changeState(state);
        level.changeState(state);

        // Let clients know ...

        var payload = {
            mode: 'teamdeathmatch',
            state: state
        };

        // ... and pass through state specific data ...

        if (data !== undefined) {
            for (var key in data) {
                payload[key] = data[key];
            }
        }

        connectionController.emit('mode:state:change', payload);

    }

    function start() {

        intro();

        return api;

    }

    function intro() {

        changeState('intro');

        setTimeout(beginMatch, 3000);

    }

    function beginMatch() {

        changeState('match');

    }

    function endMatch(data) {

        changeState('results', data);

        setTimeout(complete, 4500);

    }

    function complete() {

        if (doneCallback) {

            level.destroy();
            doneCallback();

        } else {

            console.log('ERROR: Game Mode TeamDeathMatch has no done callback.');

        }

    }

    // Chaining...

    function done(callback) {

        doneCallback = callback;

        return api;

    }

    return api;
}
