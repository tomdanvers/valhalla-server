
module.exports = function() {

    var api = {
        current: 0,
        previous: 0,
        start: start,
        stop: stop
    };

	var frequency = 10;

	var current;
	var previous;

	var onUpdateCallback;

	var timeout;

	function start(updateCallback) {

		onUpdateCallback = updateCallback;

		api.previous = new Date().getTime();

		update();

	}

	function update() {

		api.current = new Date().getTime();

		var delta = api.current - api.previous;

		onUpdateCallback(delta/1000);

        api.previous = api.current;

		timeout = setTimeout(update, frequency);

	}

	function stop() {

		clearTimeout(timeout);
		
	}

    return api;

}
