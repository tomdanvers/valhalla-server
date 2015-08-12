
module.exports = function() {

	var frequency = 10;
	
	var current;
	var previous;
	
	var onUpdateCallback;
	var onUpdateContext;

	var timeout;

	function start(updateCallback, updateContext) {

		onUpdateCallback = updateCallback;
		onUpdateContext = updateContext;

		previous = new Date().getTime();

		update();

	}

	function update() {
		
		current = new Date().getTime();
		var delta = current - previous;

		onUpdateCallback.call(onUpdateContext, delta/1000);

		setTimeout(update, frequency);

	}

}