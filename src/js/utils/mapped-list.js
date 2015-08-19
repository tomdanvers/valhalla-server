module.exports = function(id) {

    var api = {
        count: 0,
        add: add,
        remove: remove,
        has: has,
        get: get,
        getRandom: getRandom,
        each: each
    };

    var list = [];
    var map = {};

    function add(item) {

        list.push(item);
        map[item.id] = item;

        api.count = list.length;

    }

    function remove(item) {

        if (item === undefined) {
            console.warn('Removing an item from',id,'that doesn\'t exist');
        } else {

            delete map[item.id];

            var index = list.indexOf(item);
            list.splice(index, 1);

            api.count = list.length;

        }

    }

    function has(id) {
        return map[id] !== undefined;
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

    function each(callback) {
        for (var i = api.count - 1; i >= 0; i--) {
            callback(list[i]);
        }
    }

    return api;

}
