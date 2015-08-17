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
        enemies: new MappedList('alliance-foes-' + id)
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

    return api;
}
