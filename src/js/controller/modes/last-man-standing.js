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
    level.setMaxLives(1);
    level.addNPCs(30);
    level.initialiseConnections();

    // Win Criteria

    level.onPlayerScored(function(player, score) {

        var liveCount = level.getLiveCount();

        if (liveCount <= 1) {
            level.onPlayerScored(null);
            // console.log('Last Man Standing: Player', player.character.name, 'won with score of', score);
            endMatch({
                winnerId: player.model.id,
                winnerName: player.character.name,
                score: score
            });
        }

    });

    function changeState(newState, data) {

        onChangeStateCallback('lastmanstanding', newState, data);

    }

    function start() {

        // console.log('LastManStanding.start()');

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
