//global variables
var apiKey = "770704BD3483E78FADCBADEC5E76A15A";
var steamID; //= "76561198028272313";  //my steamID
var playerData;
var gameData;
var faceitLevel;

//create MutationObserver to check every created DOM Node until "Skill icon" (faceit level indicator) is found.
var observer = new MutationObserver(function (mutations) {
	mutations.forEach(function (mutation) {
		if (!mutation.addedNodes) return
		for (var i = 0; i < mutation.addedNodes.length; i++) {
			var node = mutation.addedNodes[i];
			if (typeof node.getAttribute === 'function') {
				if (node.getAttribute("class") != null) {
					if (node.getAttribute("class").includes("skill-icon")) {
						if (!node.getAttribute("alt").includes("{{")) {
							faceitLevel = node.getAttribute("alt").substring(12);
							steamID = $(".text-steam")[0].href.substring(35);
							makeApiCallPlayerStats(steamID, apiKey); //call Steam Web API
							observer.disconnect(); //stopping MutationObserver
						}
					}

				}
			}

		}
	});
});

//start MutationObserver
observer.observe(document.body, {
	childList: true
	, subtree: true
	, attributes: false
	, characterData: false
});

document.addEventListener('FSC_ready', function (e) {

	//TODO: implement callback from injected script when angular route or view changed

	//makeApiCallPlayerStats(steamID, apiKey);


});

//API Callback
function onPlayerData(xmlHttp) {
	if (xmlHttp.readyState === XMLHttpRequest.DONE && xmlHttp.status === 200) {
		var data = JSON.parse(xmlHttp.responseText);
		playerData = data;
		makeApiCallGameStats(steamID, apiKey);
	}
}

//API Callback
function onGameData(xmlHttp) {
	if (xmlHttp.readyState === XMLHttpRequest.DONE && xmlHttp.status === 200) {
		var data = JSON.parse(xmlHttp.responseText);
		gameData = data;
		handleData(playerData, gameData);
	}
}

//Call 'GetPlayerSummaries' on SteamUser Interface from Steam Web API
function makeApiCallPlayerStats(id, apiKey) {
	var xmlHttp = new XMLHttpRequest();
	var endpointRoot = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + apiKey + '&steamids=' + id;
	xmlHttp.onreadystatechange = function () { onPlayerData(xmlHttp); };
	xmlHttp.open('GET', endpointRoot, true);
	xmlHttp.send();
}

//Call 'GetUserStatsForGame' on SteamUserStats Interface from Steam Web API
function makeApiCallGameStats(id, apiKey) {
	var xmlHttp = new XMLHttpRequest();
	//var endpointRoot = 'https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=' + apiKey + '&steamid=' + id;
	var endpointRoot = 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=' + apiKey + '&steamid=' + id + '&format=json';

	xmlHttp.onreadystatechange = function () { onGameData(xmlHttp); };
	xmlHttp.open('GET', endpointRoot, true);
	xmlHttp.send();
}

//process collected Data and append to DOM
function handleData(playerData, gameData) {

	//initial rating
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

	//process Community profile visibility state. ( 3 == 'public' | 1 ==  'private, friends-only' )
	if (publicState == 3) {
		publicStateString = "public";

		gamesArray = gameData.response.games;
		gameCount = gamesArray.length;

		//calculate playtime in hours
		for (var i = 0; i < gamesArray.length; i++) {
			if (gamesArray[i].appid == 730) {
				playTime = Math.round(gamesArray[i].playtime_forever / 60.0);
			}
		}

		//process account creation time ( in unix/epoch format ) and generate age in days.
		accountCreationDate.setUTCSeconds(playerData.response.players[0].timecreated);
		var dateNow = new Date();
		var timeDiff = Math.abs(dateNow.getTime() - accountCreationDate.getTime());
		accountAgeInDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

	} else {
		gameCount = 0;
		publicStateString = "private/friends-only"; //just for testing
		accountAgeInDays = 0;
		playTime = 0;
	}



	//Basic rating calculation. This will be the big TODO.
	var factor1 = playTime; //0 - 3000
	var factor2 = gameCount * 100; //10 - 10000
	var factor3 = accountAgeInDays; //0 - 3000
	var factor4 = faceitLevel * 1000; //1000 - 10000
	var sumFactors = factor1 + factor2 + factor3 + factor4;
	console.log(sumFactors);
	estimatedMax = 26000;
	rating = Math.round((sumFactors / estimatedMax) * 100);

	//cut off rating if >100
	if (rating > 100) {
		rating = 100;
	}

	rating = 100 - rating;

	var container = document.getElementsByClassName("page-title__content__title")[0];
	var span = document.createElement("span");

	//append class to apply CSS ( style.css )
	switch (true) {
		case (0 <= rating && rating < 20):
			span.className = "smurfDisplayGreen";
			break;
		case (20 <= rating && rating < 50):
			span.className = "smurfDisplayOrange";
			break;
		case (50 <= rating && rating < 100):
			span.className = "smurfDisplayRed";
			break;
	}


	//temporary display of all collected data
	//var textnode = document.createTextNode("Profile: " + publicStateString + " | PlayTime: " + playTime + "h | Faceit Level: " + faceitLevel + " | Games: " + gameCount + " | Account Age: " + Math.round(accountAgeInDays/365) + " years | Smurf-Rating: " + rating + "/100");
	var textnode = document.createTextNode("Smurf-Rating: " + rating + "/100");
	span.appendChild(textnode);
	container.appendChild(span);

	//TODO: Display different background colors based on the rating.

}

//inject <script> tag containing inject.js into head of DOM
var injectScript = function (script) {
	var s = document.createElement('script');
	s.src = chrome.extension.getURL(script);
	(document.head || document.documentElement).appendChild(s);
	s.onload = function () {
		s.parentNode.removeChild(s);
	};
}

$(document).ready(function () {
	var url = window.location.host;
	if (url === 'www.faceit.com') {
		injectScript('inject.js');
	}
});
