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
    level.setMaxLives(1);
    level.addNPCs(20);
    level.initialiseConnections();

    // Win Criteria

    level.onAllianceScored(function(alliance, score) {

        var liveCount = alliance.getEnemyLiveCount();

        if (liveCount <= 0) {
            level.onAllianceScored(null);
            // console.log('Team Last Man Standing: Team', alliance.id, 'won with score of', score);
            endMatch({
                winner: alliance.id,
                score: score
            });
        }

    });

    function changeState(newState, data) {

        onChangeStateCallback('teamlastmanstanding', newState, data);

    }

    function start() {

        // console.log('TeamLastManStanding.start()');

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

            console.log('ERROR: Game Mode TeamLastManStanding has no done callback.');

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
