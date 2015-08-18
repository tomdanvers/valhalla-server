var MappedList = require('./utils/mapped-list');

var TEAM_COLOURS = {
    'red': 0xFF0000,
    'blue': 0x0000FF
};

module.exports = function(id) {

    // console.log('Alliance(', id, ')');

    var api = {
        id: id,
        score: 0,
        addPlayer: addPlayer,
        addEnemy: addEnemy,
        players: new MappedList('alliance-' + id),
        enemies: new MappedList('alliance-foes-' + id),
        getEnemyLiveCount: getEnemyLiveCount
    };

    function addPlayer(player) {
        player.alliance = api;
        player.model.alliance = id;
        player.model.colour = TEAM_COLOURS[id];
        api.players.add(player);
    }

    function addEnemy(enemy) {
        api.enemies.add(enemy);
    }

    function getEnemyLiveCount() {

        var liveCount = 0;
        api.enemies.each(function(player) {
            if (player.model.lives === -1 || player.model.lives > 0) {
                liveCount ++;
            }
        });

        return liveCount;
    }

    return api;
}
