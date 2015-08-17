module.exports = function(connectionController, level, environment) {

    var api = {
        start: start,
        done: done
    };

    var state;
    var doneCallback = null;

    // Initialisation
    level.setMaxLives(1);
    level.addNPCs(30);

    // Win Criteria

    level.onPlayerScored(function(player, score) {

        var liveCount = level.getLiveCount();

        if (liveCount <= 1) {
            level.onPlayerScored(null);
            console.log('Last Man Standing: Player', player.character.name, 'won with score of', score);
            endMatch({
                winner: player.character.name,
                score: score
            });
        }

    });

    function changeState(newState, data) {

        state = newState;

        // Let game objects know...

        connectionController.changeState(state);
        level.changeState(state);

        // Let clients know ...

        var payload = {
            mode: 'lastmanstanding',
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

        console.log('LastManStanding.start()');

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

            console.log('ERROR: Game Mode LastMasnStanding has no done callback.');

        }

    }

    // Chaining...

    function done(callback) {

        doneCallback = callback;

        return api;

    }

    return api;
}
