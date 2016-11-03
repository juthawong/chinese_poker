$(document).ready(function() {
	function addEventListeners(){
		$('.create').on("click",function(){$('#game-modal').modal()});
		$('#save-game').on("click",createNewGame);
		$('#games-set').on("click",'.game-title',openPlayerModal);
		$('.player-select').on("click",'.join-game',joinGame);
	}
	addEventListeners();
});


function createNewGame(e){
	e.preventDefault();
	//Prepare game for DB
	var newGame = {
    name: $('#name').val(),
    isActive: true,
    moveCounter: 0
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
  }).then(getExistingGamesFromDB());
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
	var suits = ["D", "C", "H", "S"];
	var cardValues = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"]
	for(i = 0; i < cardValues.length; i++){
		for (j = 0; j < suits.length; j++){
			var card = cardValues[i] + suits[j];
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

function joinGame(event){
	event.preventDefault();
	var playerId = $(this).attr('id');
	var gameId = $(this).attr('data-game');
	var url = '/game/' + gameId + '/players/' + playerId;
	$(location).attr('href',url);
}

function drawGamesOnScreen(games){
	$('.game').remove();
	var source = $('#game-template').html();
	var gameTemplate = Handlebars.compile(source);
	var gameHtml = gameTemplate({ game: games });
	$('#games-set').append(gameHtml);
}

function getExistingGamesFromDB(){

	$.ajax({
		method: "GET",
		url: "/api/games",
		success: function(games){
			drawGamesOnScreen(games);
		}
	});
}

getExistingGamesFromDB();


function getPlayersFromDB(game_id){
	$.ajax({
		method: "GET",
		url: "/api/" +game_id +"/players/",
		success: function(players){
			drawPlayersInModal(players);
		}
	});
}

function drawPlayersInModal(players){
	var source = $('#player-template').html();
	var playerTemplate = Handlebars.compile(source);
	var playerHtml = playerTemplate({ player: players });
	$('.player-select').append(playerHtml);
}

function openPlayerModal(event){
	event.preventDefault();
	$('#player-modal').find('.form-group').remove();
	var game_id = $(this).attr('id');
	getPlayersFromDB(game_id);
	$('#player-modal').modal();
}
