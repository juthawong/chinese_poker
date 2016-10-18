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
	this.player_name = "";

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
			self.player_name = data.name;
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
			self.displayPreviousMoves();
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
	if(self.isItMyTurn && self.selectedCards.length > 0){
		self.updatePreviousRoundOfMoves({id: self.player_id, cards: self.selectedCards});
		self.playCardsToDatabase();
		self.emitMove();
		self.updateObjectStateForMove();
		self.displayPreviousMoves();
	}
	else if(self.isItMyTurn){
		self.emitMove();
		self.updateObjectStateForMove();
		self.displayPreviousMoves();
	}
	else{
		console.log("not your turn biatch");
	}
}

Player.prototype.updatePreviousRoundOfMoves = function(move) {
	var self = this;
	if(self.previousRoundOfMoves.length < 4){
		self.previousRoundOfMoves.push(move);
	}
	else if(self.previousRoundOfMoves[1] === 'pass' && self.previousRoundOfMoves[2] === 'pass' && self.previousRoundOfMoves[3] === 'pass'){
		self.previousRoundOfMoves = [];
	}
	else{
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
		if(index >= 0){
			self.cardsInHand.splice(index,1);
		}
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
			if (opponentData.id === move.id && move.cards[0] != 'pass'){
				opponentData.numCards -= move.cards.length;
			}
		});
		self.updatePreviousRoundOfMoves(move);
		self.moveCounter++;
		self.checkIfItsMyMove();
		self.drawState();
		self.displayPreviousMoves();
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
	this.updateWhoseMoveItIs();
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
	$('.opponent0').empty();
	$('.opponent1').empty();
	$('.opponent2').empty();
	self.opponentData.forEach(function(opponent){
		var html = '<div id="'+ opponent.id+'"><p>Cards for: '+ opponent.name+'</p>';
		html += '<div class="card">X '+opponent.numCards+'</div>';
		html += '</div>'
		var num = opponent.order
		if(num === (self.order + 1) % 4){
			$('.opponent0').append(html);
		}
		else if (num === (self.order + 2) % 4){
			$('.opponent1').append(html);
		}
		else{
			$('.opponent2').append(html);
		}
	});
};

//Implement function to put previous moves on the screen
Player.prototype.displayPreviousMoves = function() {
	var self = this;
	move = self.previousRoundOfMoves[self.previousRoundOfMoves.length-1];
	move.cards.forEach(function(card){
		$('.last-play').append('<div class="card">'+ card +'</div>');
	});	
};

Player.prototype.updateWhoseMoveItIs = function() {
	var self = this;
	if((self.moveCounter % 4) === self.order ){
		$('.player-to-move').text("Player to move is " + self.player_name);
	}
	else {
		self.opponentData.forEach(function (opponent, index){
			if((self.moveCounter % 4) === opponent.order ){
				$('.player-to-move').text("Player to move is " + opponent.name);
			}
		});
	}
};



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
	player.selectedCards = ['pass'];
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
