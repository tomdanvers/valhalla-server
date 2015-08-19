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

    level.addAlliances('red', 'blue');
    level.addNPCs(24);
    level.initialiseConnections();

    // Win Criteria

    var maxScore = 25;

    level.onAllianceScored(function(alliance, score) {

        if (score >= maxScore) {
            level.onAllianceScored(null);
            console.log('TeamDeathMatch: Team', alliance.id, 'won with score of', score);
            endMatch({
                winner: alliance.id,
                score: score
            });
        }

    });

    function changeState(newState, data) {

        onChangeStateCallback('deathmatch', newState, data);

    }

    function start() {

        console.log('TeamDeathMatch.start()');

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
