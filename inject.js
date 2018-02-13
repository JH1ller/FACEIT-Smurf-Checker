
angular.element(document).ready(function () {
	//Fire CustomEvent to main.js when angular has finished loading all content
	document.dispatchEvent(new CustomEvent('FSC_ready', {
		// detail: {
			// steamID: steamID,
		// },
	}));


});







