
var fsc = {

	$scope: angular.element(document.getElementById('main-content')).injector().get('$rootScope'),
	userSettings: {
		debugMode: true
	},

	init: function () {
		if (fsc.$scope) {
			setTimeout(function () {
				fsc.init();
			}, 3000);
		} else {
			fsc.pageRefresh();
		}
	},
	pageRefresh: function () {
		angular.reloadWithDebugInfo();
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
			case "match":
				setTimeout(function () {
					fsc.eventStage.OnMatchStateChange(currentState, lastState);
					fsc.globalstate.set.match(currentState, lastState);
				}, 500);
				break;
			case "user":
				setTimeout(function () {
					fsc.eventStage.OnUserStateChange(currentState, lastState);
					fsc.globalstate.set.user(currentState, lastState);
				}, 500);
				break;
			case "match_actionUpdate":
				fsc.debug.log(fsc.globalstate.get.user());
				// To ensure that the user is currently in match room
				if (fsc.globalstate.get.user() == "MATCH") {
					fsc.eventStage.OnUserVoteStateChanged(currentState, lastState);
				}
				break;
			case "members_elementupdate":
				fsc.eventStage.OnTeamMemberElementUpdate();
				break;
			default:
				console.error("Unknown mode type caught on dispatchStateChange");

		}
		fsc.debug.log(mode);
	},
	eventStage: {

		OnUserRouteChange: function (newRoute, oldRoute) {

			fsc.debug.log("User route changed to: " + newRoute + " from " + oldRoute);
			document.dispatchEvent(new CustomEvent("FSC_ready", {
			}));
		},
		OnMatchStateChange: function (currentState, lastState) {
			// This function will be called when match state changed from one to another
			fsc.debug.log("eventStage CURRENT MATCHSTATE:" + currentState + " & LAST:" + lastState);
			var match_type = angular.element('.match-vs').scope().match.match_type;

			if (currentState == "voting") {
				fsc.fetchMapPreference();
			}

			if (currentState == "ongoing") {
				fsc.sendNotification('<h2><span class="text-primary"><strong>GL & HF!</span></strong></h2>');
				$("#joinWarning").remove();
			}

			if (currentState == "cancelled") {
				$("#joinWarning").remove();
			}
		},

		OnTeamMemberElementUpdate: function () {
			/* // Say goodbye if we not in active match room
			if (!fsc.userInMatchRoom()) {
				return;
			}

			// Check if injected element exist by counting class
			if (fsc.lobbyStats.isInjected()) {
				return;
			}

			var roomID = fsc.lobbyStats.getRoomGUID();
			fsc.debug.log("Retrived RoomID: " + roomID);

			fsc.globalstate.user.currentGame = window.location.pathname.split('/')[2];
			fsc.debug.log("User currentGame: " + fsc.globalstate.user.currentGame);
			// Check if we get 10 enough player data for this room
			if (!fsc.lobbyStats.isDataReady(roomID)) {
				// fetch data and wait to be called on next update
				fsc.debug.log("hier data fetchen");
				//fsc.lobbyStats.fetchData();
				return;
			}
			// Begin the injection of script
			fsc.lobbyStats.injectContent(); */

			console.log("OnTeamMemberElementUpdate called");
		}

	},
	debug: {
		log: function (msg) {
			if (fsc.userSettings.debugMode) {
				console.log('%c [DEBUG]' + msg, 'background: #222; color: #bada55');
			}
		}
	},

	globalstate: {
		match: { currentState: "", lastState: "" },
		user: { currentState: "", lastState: "", region: "", currentGame: "" },
		set: {
			match: function (currentState, lastState) {
				faceitHelper.globalstate.match.currentState = currentState;
				faceitHelper.globalstate.match.lastState = lastState;
			},
			user: function (currentState, lastState) {
				faceitHelper.globalstate.user.currentState = currentState;
				faceitHelper.globalstate.user.lastState = lastState;
			}
		},
		get: {
			match: function () {
				return faceitHelper.globalstate.match.currentState;
			},
			user: function () {
				return faceitHelper.globalstate.user.currentState;
			}
		}
	},

	userInMatchRoom: function () {
		return window.location.pathname.indexOf('/room/') != -1;
	}
}




angular.element(document).ready(function () {

	// Watch for user stage change
	fsc.$scope.$watch(
		function () {
			var queueScope = angular.element('.queue--sm').scope();
			if (queueScope && queueScope != null) {
				return queueScope.stage;
			}
		},
		function (newValue, oldValue) {
			fsc.dispatchStateChange(newValue, oldValue, "user");
		}
	);
	// Watch for match state change
	fsc.$scope.$watch(
		function () {
			var matchScope = angular.element('.full-hr').scope();
			if (matchScope && matchScope.match != null) {
				return matchScope.match.state;
			}
		},
		function (newValue, oldValue) {
			fsc.dispatchStateChange(newValue, oldValue, "match");
		}
	);

	// Watch for match room action change while in same state(e.g: map veto)
	fsc.$scope.$watch(
		function () {
			var matchVoteScope = angular.element('.match-vs').scope();
			if (matchVoteScope) {
				return matchVoteScope.isCurrentUserVoting;
			}
		},
		function (newValue, oldValue) {
			setTimeout(function () {
				fsc.dispatchStateChange(newValue, oldValue, "match_actionUpdate");
			}, 2000);
		}
	);

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

	// Prevent injected information being deleted on lobby page
	fsc.$scope.$watch(
		function () {
			var teamMemberScope = angular.element('match-team-member > div').scope();
			if (teamMemberScope && teamMemberScope != null && fsc.userInMatchRoom()) {
				return teamMemberScope;
			}
		},
		function (newValue, oldValue) {
			console.log("test", newValue, oldValue);
			fsc.dispatchStateChange(newValue, oldValue, "members_elementupdate");

		}
	);


});










