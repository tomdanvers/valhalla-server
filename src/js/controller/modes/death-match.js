module.exports = function(connectionController) {

    var api = {
        start: start,
        done: done
    };

    var doneCallback = null;
    var state;

    connectionController.connection(function(socket) {

        socket.emit('mode:state:current', {
            mode: 'deathmatch',
            state: state
        });

    });

    function start() {

        intro();

        return api;

    }

    function changeState(newState, data) {

        state = newState;

        var payload = {
            mode: 'deathmatch',
            state: state
        };

        for (var key in data) {
            payload[key] = data[key];
        }

        connectionController.emit('mode:state:change', payload);

    }

    function intro() {

        var length = 3000;

        changeState('intro', {length: length});

        setTimeout(begin, length);

    }

    function begin() {

        changeState('begin');

    }

    function done(callback) {

        doneCallback = callback;

        return api;

    }

    return api;
}
