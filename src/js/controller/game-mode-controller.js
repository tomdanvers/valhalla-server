var DeathMatch = require('./modes/death-match');
var TeamDeathMatch = require('./modes/team-death-match');

module.exports = function(connectionController, CONFIG, ENVIRONMENT) {

    var MODES = [DeathMatch];

    var api = {
        next: next
    };

    function next() {

        console.log('GameModeController.next()');

        var mode = new getRandom()(connectionController)
            .start()
            .done(function() {
                next();
            });

    }

    function getRandom() {
        return MODES[Math.floor(Math.random() * MODES.length)];
    }


    return api;
}
