//global variables
var apiKey = "770704BD3483E78FADCBADEC5E76A15A";
var steamID; //= "76561198028272313";  //my steamID
var playerData;
var gameData;
var faceitLevel;

//create MutationObserver to check every created DOM Node until "Skill icon" (faceit level indicator) is found.
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (!mutation.addedNodes) return
    for (var i = 0; i < mutation.addedNodes.length; i++) {
      var node = mutation.addedNodes[i];
	  if(typeof node.getAttribute === 'function'){
		  if(node.getAttribute("class") != null){
			if(node.getAttribute("class").includes("skill-icon")){
				if(!node.getAttribute("alt").includes("{{")){
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
	console.log("step 2");
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
	var rating = 50; 
	var playTime = 0;
	var publicState = "private/friends-only";
	var gamesArray = [];
	var gameCount = 0;

	gamesArray = gameData.response.games;
	gameCount = gamesArray.length;
	
	//calculate playtime in hours
	for (var i = 0; i < gamesArray.length; i++) {
		if (gamesArray[i].appid == 730) {
			playTime = Math.round(gamesArray[i].playtime_forever / 60); 
		}
	}
	
	//process Community profile visibility state. ( 3 == 'public' | 1 ==  'private, friends-only' )
	if (playerData.response.players[0].communityvisibilitystate == 3) { 
		publicState = "public";
	}
	
	//cut off rating if >100
	if (rating > 100) {
		rating = 100;
	}

	var container = document.getElementsByClassName("page-title__content__title")[0];
	var span = document.createElement("span");
	
	//append class to apply CSS ( style.css )
	span.className = "smurfDisplay";
	
	//temporary display of all collected data
	var textnode = document.createTextNode("Profile: " + publicState + " | PlayTime: " + playTime + "h | Faceit Level: " + faceitLevel + " | Games: " + gameCount);
	span.appendChild(textnode);
	container.appendChild(span);
}

//inject <script> tag containing inject.js into head of DOM
var injectScript = function (script) {
	var s = document.createElement('script');
	s.src = chrome.extension.getURL(script);
	(document.head || document.documentElement).appendChild(s);
	s.onload = function () {
		s.parentNode.removeChild(s);
	};
	console.log("works");
}

$(document).ready(function () {
	var url = window.location.host;
	if (url === 'www.faceit.com') {
		injectScript('inject.js');
	}
});
