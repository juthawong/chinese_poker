// Initialize web socket
var socket = io();

function Player (game_id, player_id){
	this.game_id = game_id;
	this.player_id = player_id;
	this.opponentData = [];
	this.isActive = true;
	this.cardsInHand = [];
	this.isItMyTurn = false;
	this.selectedCards = [];
	this.order;
	this.moveCounter = 0;
	this.previousRoundOfMoves = [];

	//Initialize game data and socket
	this.getCardDataFromDatabase();
	this.getOpponentInfoFromDatabase();
	this.getMoveCounterAndRound();
	this.listenForMoves();
}

Player.prototype.getCardDataFromDatabase = function(){
	var self = this;
	$.ajax({
		method: "GET",
		url: '/api/' + self.game_id + '/players/' + self.player_id,
		success: function(data){
			self.cardsInHand = data.cardsInHand;
			self.order = data.order;
			self.drawState();
		}
	});
}

Player.prototype.getMoveCounterAndRound = function() {
	var self = this;
	$.ajax({
		method: "GET",
		url: '/api/' + self.game_id,
		success: function(game){
			self.moveCounter = game.moveCounter;
			self.previousRoundOfMoves = game.previousRoundOfMoves;
			self.checkIfItsMyMove();
		}
	});
};

Player.prototype.getOpponentInfoFromDatabase = function(){
	var self = this;
	$.ajax({
		method: "GET",
		url: '/api/' + this.game_id + '/players/excluding/' + this.player_id,
		success: function(opponentPlayers){
			opponentPlayers.forEach(function(opponentPlayer){
				self.opponentData.push({id: opponentPlayer._id, 
														 numCards: opponentPlayer.cardsInHand.length, 
														 name: opponentPlayer.name, 
														 order: opponentPlayer.order})
				self.drawState();
			});
		}
	});
}

Player.prototype.selectCard = function(card){
	var self = this;
	self.selectedCards.push(card);
}

Player.prototype.deselectCard = function(card){
	var index = this.selectedCards.indexOf(card);
	if(index > -1 ){
		this.selectedCards.splice(index,1);
	}
}

Player.prototype.playCards = function(){
	var self = this;
	//TODO fix this line for passing
	if(self.isItMyTurn && self.selectedCards.length > 0){
		self.updatePreviousRoundOfMoves({id: self.player_id, cards: self.selectedCards});
		self.playCardsToDatabase();
		self.emitMove();
		self.updateObjectStateForMove();
	}
	else if(self.isItMyTurn){
		self.emitMove();
		self.updateObjectStateForMove();
	}
	else{
		console.log("not your turn biatch");
	}
}

Player.prototype.updatePreviousRoundOfMoves = function(move) {
	var self = this;
	console.log('here');
	if(self.previousRoundOfMoves.length < 4){
		self.previousRoundOfMoves.push(move);
		console.log('updated');
	}
	else if(self.previousRoundOfMoves[1] === 'pass' && self.previousRoundOfMoves[2] === 'pass' && self.previousRoundOfMoves[3] === 'pass'){
		self.previousRoundOfMoves = [];
	}
	else{
		console.log('no im actually here');
		self.previousRoundOfMoves.shift();
		self.previousRoundOfMoves.push(move);
	}
};

Player.prototype.playCardsToDatabase = function(){
	var self = this;
	$.ajax({
		url: "/api/" + self.game_id + '/players/' + self.player_id,
		method:"PUT",
		data: {cards: self.selectedCards},
		success: function(player){
			console.log(player);
			self.addToMoveCounterAndRoundInDB();
		}
	});
}

Player.prototype.addToMoveCounterAndRoundInDB = function(){
	var self = this;
	$.ajax({
		url: "/api/" + self.game_id + "/moveCounter",
		method:"PUT",
		data: {previousRoundOfMoves: self.previousRoundOfMoves},
		success: function(game){
			console.log(game);
		}
	});
}

Player.prototype.emitMove = function() {
	var self = this;
	socket.emit('move',{id: self.player_id, cards: self.selectedCards});
	return false;
};

Player.prototype.updateObjectStateForMove = function() {
	var self = this;
	self.selectedCards.forEach(function(card){
		var index = self.cardsInHand.indexOf(card);
		self.cardsInHand.splice(index,1);
	});
	self.selectedCards = [];
	self.moveCounter++;
	self.isItMyTurn = false;
	self.drawState();
};

Player.prototype.listenForMoves = function(move) {
	var self = this;
	socket.on('move', function(move){
		self.opponentData.forEach(function(opponentData){
			if (opponentData.id === move.id){
				opponentData.numCards -= move.cards.length;
			}
		});
		self.updatePreviousRoundOfMoves(move);
		self.moveCounter++;
		self.checkIfItsMyMove();
		self.drawState();
	});
}

Player.prototype.checkIfItsMyMove = function() {
	var self = this;
	if(self.moveCounter % 4 === self.order){
		self.isItMyTurn = true;
	}
};

Player.prototype.drawState = function() {
	$('.card').remove();
	$('.opponent').remove();
	this.drawStateForPlayer();
	this.drawStateForOpponents();
};

Player.prototype.drawStateForPlayer = function() {
	var self = this;
	var playerSource = $('#player-template').html();
	var playerTemplate = Handlebars.compile(playerSource);
	var playerHtml = playerTemplate({card: self.cardsInHand});
	$('.player').append(playerHtml);
};

Player.prototype.drawStateForOpponents = function() {
	var self = this;
	self.opponentData.forEach(function(opponent){
		var html = '<div class="opponent" id="'+ opponent.id+'"><p>Cards for: '+ opponent.name+'</p>';
		for(i = 0; i<opponent.numCards; i++){
			html += '<div class="card"></div>';
		}
		html += '</div>'
		$('.opponents').append(html);
	});
};

//TODO implement function to put previous moves on the screen
// Player.prototype.displayPreviousMoves = function() {
// 	var self = this;
// 	self.previousRoundOfMoves.forEach(function(move){
// 		$('"#' + move.id + '"').append(move.cards);
// 	});
// };



var game_id = $(location)[0].pathname.split("/")[2];
var player_id = $(location)[0].pathname.split("/")[4];
var player = new Player(game_id,player_id);

$(document).ready(function() {
	function addEventListeners(){
		$('.play-cards').on("click",playCardsHandler);
		$('.pass').on("click",passHandler);
		$('.player').on("click",'.my-card',selectCardHandler)
	}
	addEventListeners();
});

function playCardsHandler(event){
	player.playCards();
}

function passHandler(event){
	player.selectedCards = [];
	player.playCards();
}

function selectCardHandler(event){
	var self = this
	if ($(self).hasClass('selected')){
		var myCard = $(self).attr('id');
		player.deselectCard(myCard);
		$(self).toggleClass('selected');
	}
	else{
		var myCard = $(self).attr('id');
		player.selectCard(myCard);	
		$(self).toggleClass('selected');
	}
}