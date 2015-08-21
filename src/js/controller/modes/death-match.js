module.exports = function(connectionController, level, environment) {

    var api = {
        start: start,
        onChangeState: onChangeState,
        done: done
    };

    var state;
    var doneCallback = null;
    var onChangeStateCallback = null;

    // Initialisation

    level.addNPCs(environment.npcCount);
    level.initialiseConnections();

    // Win Criteria

    var maxScore = 10;

    level.onPlayerScored(function(player, score) {

        if (score >= maxScore) {
            level.onPlayerScored(null);
            // console.log('DeathMatch: Player', player.character.name, 'won with score of', score);
            endMatch({
                winnerId: player.model.id,
                winnerName: player.character.name,
                score: score
            });
        }

    });

    function changeState(newState, data) {

        onChangeStateCallback('deathmatch', newState, data);

    }

    function start() {

        // console.log('DeathMatch.start()');

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

            console.log('ERROR: Game Mode DeathMatch has no done callback.');

        }

    }

    // Chaining...

    function onChangeState(callback) {

        onChangeStateCallback = callback;

        return api;
    }

    function done(callback) {

        doneCallback = callback;

        return api;

    }

    return api;
}
