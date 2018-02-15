
var fsc = {

	$scope: angular.element(document).scope(),
	userSettings: {
		debugMode: true
	},

	dispatchStateChange: function (currentState, lastState, mode) {
		// This function check for data validity before passing to designated function
		if (!currentState) {
			return;
		}

		if (!lastState) {
			lastState = "PAGE_LOAD";
		}

		switch (mode) {
			case "url":
				fsc.eventStage.OnUserRouteChange(currentState, lastState);
				break;
			default:
				console.error("Unknown mode type caught on dispatchStateChange");
		}

	},
	eventStage: {
		
		OnUserRouteChange: function(newRoute, oldRoute) {

			fsc.debug.log("User route changed to: " + newRoute + " from " + oldRoute);
			
		}
	},
	debug: {
		log: function(msg) {
			if(fsc.userSettings.debugMode) {
				console.log('%c [DEBUG]' + msg, 'background: #222; color: #bada55');
			}
		}
	},
}





angular.element(document).ready(function () {
	

	// Watch for route change
	fsc.$scope.$watch(
		function () {
			return window.location.pathname;
		},
		function (newValue, oldValue) {
			setTimeout(function () {
				fsc.dispatchStateChange(newValue, oldValue, "url");
			}, 2000);
		}
	);
	//Fire CustomEvent to main.js when angular has finished loading all content
	document.dispatchEvent(new CustomEvent("FSC_ready", {
		// detail: {
		// steamID: steamID,
		// },
	}));


});










