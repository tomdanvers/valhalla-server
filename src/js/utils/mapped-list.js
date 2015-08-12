module.exports = function() {

    var api = {
        count: 0,
        add: add,
        remove: remove,
        get: get,
        getRandom: getRandom
    };

    var list = [];
    var map = {};

    function add(item) {

        list.push(item);
        map[item.id] = item;

        api.count = list.length;

    }

    function remove(item) {

        delete map[item.id];

        var index = list.indexOf(item);
        list.splice(index, 1);

        api.count = list.length;

    }

    function get(val) {
        if (typeof(val) === 'string') {
            return map[val];
        } else {
            return list[val];
        }

    }

    function getRandom() {

        return list[Math.floor(api.count * Math.random())];

    }

    return api;

}
