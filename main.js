// global variables
var debug = true;
var apiKey = "770704BD3483E78FADCBADEC5E76A15A";
var steamID;
var steamIDs = [];
var playerData;
var gameData;
var faceitLevel;
var faceitLevels = [];
var elementFound = false;

// create MutationObserver to check every created DOM Node until "Skill icon" (faceit level indicator) is found.
var profileObserver = new MutationObserver(function (mutations) {
	mutations.forEach(function (mutation) {
		if (!mutation.addedNodes) {
			 return;
		}

		for (var i = 0; i < mutation.addedNodes.length && !elementFound; i++) {
			var node = mutation.addedNodes[i];
			if (typeof node.getAttribute === "function") {
				if (node.getAttribute("class") != null) {
					if (node.getAttribute("class").includes("skill-icon")) {
						if (!node.getAttribute("alt").includes("{{")) {
							faceitLevel = node.getAttribute("alt").substring(12);
							steamID = $(".text-steam")[0].href.substring(35);
							elementFound = true;
							makeApiCallPlayerStats(steamID, apiKey); // call Steam Web API
							profileObserver.disconnect(); // stopping MutationObserver
						}
					}

				}
			}
		}
	});
});

// create MutationObserver to check every created DOM Node until "Skill icon" (faceit level indicator) is found.
var matchObserver = new MutationObserver(function (mutations) {
	mutations.forEach(function (mutation) {
		if (!mutation.addedNodes) { 
			return; 
		}

		for (var i = 0; i < mutation.addedNodes.length && !elementFound; i++) {
			var node = mutation.addedNodes[i];
			if (typeof node.getAttribute === "function") {
				if (node.getAttribute("uib-tooltip") != null) {
					if (node.getAttribute("uib-tooltip").includes("Steam Profile")) {
						steamIDs.push(node.getAttribute("href").substring(36));
					}
				}
				if (node.getAttribute("class") != null) {
					if (node.getAttribute("class").includes("skill-icon")) {
						if (!node.getAttribute("alt").includes("{{")) {
							faceitLevels.push(node.getAttribute("alt").substring(12));
						}
					}
				}
				
				if (faceitLevels.length == 10 && steamIDs.length >= 9) {
					elementFound = true;
					console.log("S U C C");
					// makeApiCallPlayerStats(steamID, apiKey); // call Steam Web API
					profileObserver.disconnect(); // stopping MutationObserver 
				}
			}

		}
	});
});



document.addEventListener("FSC_ready", function (e) {
	// TODO: implement callback from injected script when angular route or view changed

	// makeApiCallPlayerStats(steamID, apiKey);
});


// call 'GetPlayerSummaries' on SteamUser Interface from Steam Web API
function makeApiCallPlayerStats(id, apiKey) {
	var url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=" + apiKey + "&steamids=" + id;

	$.get(url, function(data) {
		playerData = data;
		makeApiCallGameStats(steamID, apiKey);
	});
}

// call 'GetUserStatsForGame' on SteamUserStats Interface from Steam Web API
function makeApiCallGameStats(id, apiKey) {
	// var url = 'https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=' + apiKey + '&steamid=' + id;
	var url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=" + apiKey + "&steamid=" + id + "&format=json";

	$.get(url, function(data){
		gameData = data;
		handleData(playerData, gameData);
	});
}

// process collected Data and append to DOM
function handleData(playerData, gameData) {

	// initial rating
	var rating;
	var estimatedMax;
	var playTime = 0;
	var publicStateString;
	var publicState;
	var gamesArray = [];
	var gameCount;
	var accountCreationDate = new Date(0);
	var accountAgeInDays = 0;

	publicState = playerData.response.players[0].communityvisibilitystate;

	// process Community profile visibility state. ( 3 == 'public' | 1 ==  'private, friends-only' )
	if (publicState === 3) {
		publicStateString = "public";

		gamesArray = gameData.response.games;
		gameCount = gamesArray.length;

		// calculate playtime in hours
		for (var i = 0; i < gamesArray.length; i++) {
			if (gamesArray[i].appid === 730) {
				playTime = Math.round(gamesArray[i].playtime_forever / 60.0);
			}
		}

		// process account creation time ( in unix/epoch format ) and generate age in days.
		accountCreationDate.setUTCSeconds(playerData.response.players[0].timecreated);
				
		var timeDiff = Math.abs(Date.now() - accountCreationDate.getTime());
		accountAgeInDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
	} else {
		gameCount = 0;
		publicStateString = "private/friends-only"; // just for testing
		accountAgeInDays = 0;
		playTime = 0;
	}

	// Basic rating calculation. This will be the big TODO.
	var factor1 = playTime * 6; // 0 - 18000
	var factor2 = gameCount * 1000; // 10 - 10000
	var factor3 = accountAgeInDays * 6; // 0 - 18000
	var factor4 = faceitLevel * 1000; // 1000 - 10000
	var sumFactors = factor1 + factor2 + factor3 + factor4;
	estimatedMax = 56000;
	console.log("Profile scored " + sumFactors + " points. " + estimatedMax + " equals 0/100 Smurf-rating.");
	rating = Math.round((sumFactors / estimatedMax) * 100);
	if (debug) {
		console.log("PlayTime Score: " + Math.round((factor1 / 18000) * 100) + "%");
		console.log("Game Count Score: " + Math.round((factor2 / 10000) * 100) + "%");
		console.log("Account Age Score: " + Math.round((factor3 / 18000) * 100) + "%");
		console.log("FaceIt Level Score: " + Math.round((factor4 / 10000) * 100) + "%");
	}

	// cut off rating if >100
	if (rating > 100) {
		rating = 100;
	}

	rating = 100 - rating;

	var container = document.getElementsByClassName("page-title__content__title")[0];
	var span1 = document.createElement("span");
	var span2 = document.createElement("span");
	var hoverContainer = document.createElement("div");
	hoverContainer.className = "hoverContainer";

	// append class to apply CSS ( style.css )
	switch (true) {
		case (0 <= rating && rating < 20):
			span1.className = "fscDisplayGreen fsc";
			span2.className = "fscDisplayGreen fsc";
			break;
		case (20 <= rating && rating < 50):
			span1.className = "fscDisplayOrange fsc";
			span2.className = "fscDisplayOrange fsc";
			break;
		case (50 <= rating && rating < 100):
			span1.className = "fscDisplayRed fsc";
			span2.className = "fscDisplayRed fsc";
			break;
	}

	// Display of all collected data
	if (publicState == 3) {
		var textnode1 = document.createTextNode("Smurf-Rating: " + rating + "/100");
		var textnode2 = document.createTextNode("Profile: " + publicStateString + " | PlayTime: " + playTime + "h | Games: " + gameCount + " | Account Age: " + Math.round(accountAgeInDays / 365) + " years");
		span1.appendChild(textnode1);
		span2.appendChild(textnode2);
		span1.setAttribute("id", "span1");
		span2.setAttribute("id", "span2");
		hoverContainer.appendChild(span1);
		hoverContainer.appendChild(span2);
		container.appendChild(hoverContainer);
	} else {
		var textnode1 = document.createTextNode("Profile: " + publicStateString);
		span1.appendChild(textnode1);
		container.appendChild(span1);
	}

	// TODO: Display different background colors based on the rating.

}

// inject <script> tag containing inject.js into head of DOM
var injectScript = function (script) {
	var s = document.createElement("script");
	s.src = chrome.extension.getURL(script);
	(document.head || document.documentElement).appendChild(s);
	s.onload = function () {
		s.parentNode.removeChild(s);
	};
}

$(document).ready(function () {
	var url = window.location.host;
	if (url === "www.faceit.com") {
		injectScript("inject.js");
	}
	//start MutationObserver
	if (window.location.pathname.startsWith("/en/csgo/room/")) {
		matchObserver.observe(document.body, {
			childList: true
			, subtree: true
			, attributes: false
			, characterData: false
		});
	} else if (window.location.pathname.startsWith("/en/players/")) {
		profileObserver.observe(document.body, {
			childList: true
			, subtree: true
			, attributes: false
			, characterData: false
		});
	}


});


