$(document).ready(function() {
	function addEventListeners(){
		$('.create').on("click",function(){$('#game-modal').modal()});
		$('#save-game').on("click",createNewGame);
		//TODO have modal to select which player you want to be
	}
	addEventListeners();
});


function createNewGame(e){
	e.preventDefault();
	//Prepare game for DB
	var newGame = {
    name: $('#name').val(),
    isActive: true
  };

  //Prepare players for DB
  var playersArray = [];
  for(i = 0; i < 4; i++){
  	var newPlayer = {
		  name: $('#player' + (i + 1)).val(),
		  cardsInHand: [],
		  order: i
  	}
  	playersArray.push(newPlayer);
  }

  playersArray = dealCards(playersArray);

  $('#game-modal').modal('toggle');

  //Post new game and players to the server
  $.ajax({
    method: "POST",
    url: "/api/",
    data: newGame,
    success: function(game){
 			console.log(game);
 			//Append game id to the players
 			for(i = 0; i < playersArray.length;i++){
 				playersArray[i].game = game._id;
 			}
 			console.log(playersArray);
 			loadPlayersToDB(playersArray);
    } 
  });
}

function loadPlayersToDB(playersArray){
	$.ajax({
    method: "POST",
    url: "/api/"+playersArray[0].game+"/players",
    data: {array: playersArray},
    success: function(players){
    	console.log(players);
    }
  });
}

function dealCards (playersArray) {
	var suits = ["C", "D", "H", "S"];
	var cardValues = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
	for(i = 0; i < suits.length; i++){
		for (j = 0; j < cardValues.length; j++){
			var card = cardValues[j] + suits[i];
			var foundPlayer = false;
			while(!foundPlayer){
				var playerNumber = Math.floor(Math.random() * 4);
				if(playersArray[playerNumber].cardsInHand.length < 13){
					playersArray[playerNumber].cardsInHand.push(card);
					foundPlayer = true;
				}
			}
		}	
	}
	return playersArray;
};

function getExistingGamesFromDB(){
	$.ajax({
		method: "GET",
		url: "/api/games",
		success: function(games){
			console.log(games);
		}
	})
}


