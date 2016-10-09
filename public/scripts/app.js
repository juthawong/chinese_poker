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

	//Initialize game data and socket
	this.getCardDataFromDatabase();
	this.getOpponentInfoFromDatabase();
	this.getMoveCounter();
	this.listenForMoves();
	this.drawState();
}

Player.prototype.getCardDataFromDatabase = function(){
	self = this;
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

Player.prototype.getMoveCounter = function() {
	self = this;
	$.ajax({
		method: "GET",
		url: '/api/' + self.game_id,
		success: function(game){
			console.log(game);
			self.moveCounter = game.moveCounter;
			self.checkIfItsMyMove();
		}
	});
};

Player.prototype.getOpponentInfoFromDatabase = function(){
	self = this;
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

Player.prototype.selectCard = function(cardsArray){
	self = this;
	cardsArray.forEach(function(card){
		if(self.cardsInHand.indexOf(card) > -1){
			self.selectedCards.push(card);
		}
	})
}

Player.prototype.deselectCard = function(card){
	var index = this.selectedCards.indexOf(card);
	if(index > -1 ){
		this.selectedCards.splice(index,1);
	}
}

Player.prototype.playCards = function(){
	self = this;
	if(self.isItMyTurn && self.selectedCards.length > 0){
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

Player.prototype.playCardsToDatabase = function(){
	self = this;
	$.ajax({
		url: "/api/" + self.game_id + '/players/' + self.player_id,
		method:"PUT",
		data: {cards: self.selectedCards},
		success: function(player){
			console.log(player);
			self.addToMoveCounterInDB();
		}
	});
}

Player.prototype.addToMoveCounterInDB = function(){
	self = this;
	$.ajax({
		url: "/api/" + self.game_id + "/moveCounter",
		method:"PUT",
		success: function(game){
			console.log(game);
		}
	});
}

Player.prototype.emitMove = function() {
	self = this;
	socket.emit('move',{id: self.player_id, cards: self.selectedCards});
	return false;
};

Player.prototype.updateObjectStateForMove = function() {
	self = this;
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
	self = this;
	socket.on('move', function(move){
		self.opponentData.forEach(function(opponentData){
			if (opponentData.id === move.id){
				opponentData.numCards -= move.cards.length;
			}
		});
		self.moveCounter++;
		self.checkIfItsMyMove();
		self.drawState();
	});
}

Player.prototype.checkIfItsMyMove = function() {
	self = this;
	console.log()
	if(self.moveCounter % 4 === self.order){
		self.isItMyTurn = true;
	}
};

Player.prototype.drawState = function() {
	$('.card').remove();
	$('p').remove();
	this.drawStateForPlayer();
	this.drawStateForOpponents();
};

Player.prototype.drawStateForPlayer = function() {
	self = this;
	var playerSource = $('#player-template').html();
	var playerTemplate = Handlebars.compile(playerSource);
	var playerHtml = playerTemplate({card: self.cardsInHand});
	$('.player').append(playerHtml);
};

Player.prototype.drawStateForOpponents = function() {
	self = this;
	self.opponentData.forEach(function(opponent){
		var html = '<div class="opponent '+ opponent.id+'"><p>Cards for: '+ opponent.name+'</p>';
		for(i = 0; i<opponent.numCards; i++){
			html += '<div class="card">blank</div>';
		}
		html += '</div>'
		$('.opponents').append(html);
	});

};


var game_id = $(location)[0].pathname.split("/")[2];
var player_id = $(location)[0].pathname.split("/")[4];
var player = new Player(game_id,player_id);

// initGame();