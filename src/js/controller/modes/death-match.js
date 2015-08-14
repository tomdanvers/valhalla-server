module.exports = function(connectionController, level) {

    var api = {
        start: start,
        done: done
    };

    var doneCallback = null;
    var state;

    // Win Criteria

    var maxScore = 10;

    level.onPlayerScored(function(player, score) {

        if (score >= maxScore) {
            level.onPlayerScored(null);
            console.log('DeathMatch: Player', player.character.name,'won with score of', score);
            endMatch();
        }
    });

    function start() {

        intro();

        return api;

    }

    function changeState(newState, data) {

        state = newState;

        // Let game objects know...
        connectionController.changeState(state);

        level.changeState(state);

        // Let clients know ...

        var payload = {
            mode: 'deathmatch',
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

    function intro() {

        var duration = 3000;

        setTimeout(beginMatch, duration);

        changeState('intro', {duration: duration});

    }

    function beginMatch() {

        changeState('match');

    }

    function endMatch() {

        results();

    }

    function results() {

        var duration = 3000;

        setTimeout(complete, duration);

        changeState('results', {duration: duration});

    }

    function complete() {

        if (doneCallback) {
            level.destroy();
            doneCallback();
        } else {
            console.log('ERROR: Game Mode DeathMatch has no done callback.');
        }

    }

    // Chaining...

    function done(callback) {

        doneCallback = callback;

        return api;

    }

    return api;
}
