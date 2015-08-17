module.exports = function(id, character, isNPC, config) {

    var pixelsPerMetre = 32;

    var api = {
        id: id,
        character: character,
        alliance: null,
        model: {
            id: id,
            alliance: null,
            x: 0,
            y: 0,
            levelY: 0,
            previousX: 0,
            previousY: 0,
            facing: 1,
            health: 25,
            score: 0,
            name: character.name,
            isNPC: isNPC,
            colour: Math.floor(0xFFFFFF*Math.random())
        },
        input: {
            up: false,
            down: false,
            left: false,
            right: false
        },
        velocityMax: {
            x: 10 * pixelsPerMetre,
            y: 25 * pixelsPerMetre
        },
        velocity: {
            x: 0,
            y: 0
        },
        accelerationMax: {
            x: 128 * pixelsPerMetre,
            y: 64 * pixelsPerMetre
        },
        acceleration: {
            x: 0,
            y: 0
        },
        width: config.player.width,
        widthHalf: config.player.width*.5,
        height: config.player.height,
        isGrounded: false,
        isAlive: true,
        attackCooldown: 0,
        target: null
    };

    return api;
}
