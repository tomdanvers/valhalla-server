var DeathMatch = require('./modes/death-match');
var TeamDeathMatch = require('./modes/team-death-match');

var MappedList = require('../utils/mapped-list');

module.exports = function(io, CONFIG, ENVIRONMENT) {

    var api = {
        emit: emit,
        connection: connection
    };

    var TYPE_INPUT = new MappedList();
    var TYPE_SCREEN = new MappedList();
    var TYPE_BOTH = new MappedList();

    var connectionCallback = null;

    var typesMap = {
        'screen': TYPE_SCREEN,
        'input': TYPE_INPUT,
        'both': TYPE_BOTH
    };

    io.sockets.on('connection', connectionHandler);

    function connectionHandler(socket) {

        console.log('CC.connectionHandler(', socket.id, ')');

        // Send initial handshake...
        socket.emit('handshake');

        // ... and get it back...
        socket.on('handshake', handshakeHandler);

        // Handle disconnections
        socket.on('disconnect', disconnectionHandler);

    }

    function handshakeHandler(data) {

        console.log('CC.handshakeHandler(', this.id, data.type, ')');

        var type = typesMap[data.type];
        this.type = data.type;
        type.add(this);

        this.emit('connected');

        if (connectionCallback) {
            connectionCallback(this);
        }
    }

    function disconnectionHandler() {

        console.log('CC.disconnectionHandler(', this.id, this.type, ')');

        var type = typesMap[this.type];
        type.remove(this);

    }

    function emit(type, data) {

        TYPE_INPUT.each(function(socket) {
            socket.emit(type, data);
        });

        TYPE_SCREEN.each(function(socket) {
            socket.emit(type, data);
        });

        TYPE_BOTH.each(function(socket) {
            socket.emit(type, data);
        });
    }

    function connection(callback) {
        connectionCallback = callback;
    }


    return api;
}
