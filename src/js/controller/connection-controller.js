var DeathMatch = require('./modes/death-match');
var TeamDeathMatch = require('./modes/team-death-match');

var CharacterUtils = require('../utils/character-utils');
var MappedList = require('../utils/mapped-list');

module.exports = function(io, CONFIG, ENVIRONMENT) {


    var TYPE_INPUT = new MappedList();
    var TYPE_SCREEN = new MappedList();
    var TYPE_BOTH = new MappedList();

    var connectionCallback = null;
    var disconnectionCallback = null;
    var state = null;
    var map = null;

    var typesMap = {
        'screen': TYPE_SCREEN,
        'input': TYPE_INPUT,
        'both': TYPE_BOTH
    };

    var api = {
        emit: emit,
        connection: connection,
        disconnection: disconnection,
        state: null,
        map: null,
        mode: null,
        input: TYPE_INPUT,
        both: TYPE_BOTH,
        screen: TYPE_SCREEN
    };

    io.sockets.on('connection', connectionHandler);

    function connectionHandler(socket) {

        // console.log('CC.connectionHandler(', socket.id, ')');

        // Send initial handshake...
        socket.emit('handshake');

        // ... and get it back...
        socket.on('handshake', handshakeHandler);

    }

    function handshakeHandler(data) {

        //this.off('handshake', handshakeHandler);


        var type = typesMap[data.type];
        this.type = data.type;
        this.character = CharacterUtils.getRandomCharacter();
        type.add(this);

        // console.log('CC.handshakeHandler(', this.id, data.type, this.character.name, ')');

        this.emit('connected', {
            mode: api.mode,
            state: api.state,
            map: api.map,
            character: this.character
        });

        if (connectionCallback) {
            connectionCallback(this);
        }

        // Handle disconnections
        this.on('disconnect', disconnectionHandler);

    }

    function disconnectionHandler() {

        // console.log('CC.disconnectionHandler(', this.id, this.type, ')');

        //this.off('disconnect', disconnectionHandler);

        var type = typesMap[this.type];

        type.remove(this);

        if (disconnectionCallback) {
            disconnectionCallback(this);
        }

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

        return api;
    }

    function disconnection(callback) {
        disconnectionCallback = callback;

        return api;
    }

    return api;
}
