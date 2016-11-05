// Initialize web socket
var socket = io();
var player;

function Player (game_id, player_id){
	var self = this;
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

	//Initialize game data
	$.when(
		//Load 3 data sets from the db
		self.getCardDataFromDatabase(), 
		self.getOpponentInfoFromDatabase(), 
		self.getMoveCounterAndRound())
	 .done(function(){
	 	//once data is loaded, display everything on screen
	 	self.checkIfItsMyMove();
	 	self.drawState();
	 	self.displayPreviousMoves();
	});
	//Load web sockets
	this.listenForMoves();
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
		self.updatePreviousRoundOfMoves({id: self.player_id, cards: self.selectedCards, name: self.player_name});
		self.playCardsToDatabase();
		self.emitMove();
		self.isItMyTurn = false;
		self.updateObjectStateForMove();
		self.displayPreviousMoves();
	}
	else{
		console.log("something went wrong");
	}
}

Player.prototype.updatePreviousRoundOfMoves = function(move) {
	var self = this;
	var roundIndex = self.previousRoundOfMoves.length-1 < 0 ? 0 : self.previousRoundOfMoves.length-1;
	if(self.previousRoundOfMoves[roundIndex]){
		var countIndex = self.previousRoundOfMoves[roundIndex].round.length-1;
	}
	else {
		countIndex = 0;
	}
	
	if( self.previousRoundOfMoves.length === 0 ){
		self.previousRoundOfMoves.push({round: [move]});
	}
	else if(self.previousRoundOfMoves[roundIndex].round.length > 3){
		if(self.previousRoundOfMoves[roundIndex].round[countIndex].cards[0] === 'pass' && self.previousRoundOfMoves[roundIndex].round[countIndex-1].cards[0] === 'pass' && self.previousRoundOfMoves[roundIndex].round[countIndex-2].cards[0] === 'pass'){
		self.previousRoundOfMoves.push({round: [move]})
		}
		else {
			self.previousRoundOfMoves[roundIndex].round.push(move);
		}
	}
	else {
		self.previousRoundOfMoves[roundIndex].round.push(move);
	}
};

Player.prototype.emitMove = function() {
	var self = this;
	socket.emit('move',{id: self.player_id, cards: self.selectedCards, name: self.player_name});
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
	self.drawState();
};

Player.prototype.listenForMoves = function() {
	var self = this;
	socket.on('undo', function(){
		console.log('got message to undo');
		location.reload();
	});
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
	else{
		self.isItMyTurn = false;
	}
};

Player.prototype.drawState = function() {
	$('.card').remove();
	$('.opponent').remove();
	this.drawStateForPlayer();
	this.drawStateForOpponents();
	this.updateWhoseMoveItIs();
	this.displayMoveHistory();
};

Player.prototype.drawStateForPlayer = function() {
	var self = this;
	var playerSource = $('#player-template').html();
	var playerTemplate = Handlebars.compile(playerSource);
	var cardImages = self.cardsInHand.map(function(card){
		return {value: card, image: images(card)};
	});
	var playerHtml = playerTemplate({card: cardImages});
	$('.player').append(playerHtml);
};

Player.prototype.drawStateForOpponents = function() {
	var self = this;
	$('.opponent0').empty();
	$('.opponent1').empty();
	$('.opponent2').empty();
	self.opponentData.forEach(function(opponent){
		var html = '<div id="'+ opponent.id+'"><p>Cards for: '+ opponent.name+'</p>';
		html += '<div class="card">x '+opponent.numCards+'</div>';
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
	var currentRound = self.previousRoundOfMoves.length-1;
	var i = self.previousRoundOfMoves[currentRound].round.length-1;
	while(i >= 0){
		move = self.previousRoundOfMoves[currentRound].round[i];
		if(move.cards[0] === 'pass'){
			i--;
			continue;
		}
		else{
			move.cards.forEach(function(card){
				var image = images(card);
				$('.last-play').append('<img class="card" src="'+image+'">');
			});	
			break;
		}
	}
};

Player.prototype.updateWhoseMoveItIs = function() {
	var self = this;
	if((self.moveCounter % 4) === self.order ){
		$('.player-to-move').text("Player to move is " + self.player_name);
	}
	else {
		self.opponentData.forEach(function (opponent, index){
			if((self.moveCounter % 4) === opponent.order){
				$('.player-to-move').text("Player to move is " + opponent.name);
			}
		});
	}
};

Player.prototype.displayMoveHistory = function() {
	self = this;
	$('.historical-move').remove();
	var historySource = $('#history-template').html();
	var historyTemplate = Handlebars.compile(historySource);
	var roundIndex = self.previousRoundOfMoves.length-1;
	if (roundIndex < 0){
		roundIndex = 0;
	}
	var reversedArray = Array.prototype.slice.call(self.previousRoundOfMoves[self.previousRoundOfMoves.length-1].round).reverse();
	var historyHtml = historyTemplate({move: reversedArray});
	$('#history').append(historyHtml);
};


$(document).ready(function() {
	var game_id = $(location)[0].pathname.split("/")[2];
	var player_id = $(location)[0].pathname.split("/")[4];
	player = new Player(game_id,player_id);

	function addEventListeners(){
		$('.play-cards').on("click",playCardsHandler);
		$('.pass').on("click",passHandler);
		$('.undo').on("click",undoHandler);
		$('.player').on("click",'.my-card',selectCardHandler)
		$('.go-home').on("click",function(){
			$(location).attr('href','/');
		});
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

function undoHandler(event){
	event.preventDefault();
	if (player.moveCounter === 0) {
		return true;
	}
	var currentRound = player.previousRoundOfMoves.length-1;
	var lastMove = player.previousRoundOfMoves[currentRound].round.pop();

	var undoPlayerData = function() {
		$.ajax({
			url: "/api/" + player.game_id + '/players/' + lastMove.id + "/undo",
			method:"PUT",
			data: {cards: lastMove.cards},
			success: function(json){
				console.log(json);
			}
		});
	}

	var undoGameData = function() {
		$.ajax({
			url: '/api/' + player.game_id + '/undo',
			method:"PUT",
			data: {previousRoundOfMoves: player.previousRoundOfMoves},
			success: function(json){
				console.log(json);
			}
		});
	}

	if (lastMove.cards[0] === 'pass'){
		$.when(
			//Undo data in 2 places
			undoGameData())
		 .done(function(){
		 	//once data is loaded, refresh to get clean data
		 	socket.emit('undo');
			location.reload();
		});
	}
	else{
		$.when(
			//Undo data in 2 places
			undoPlayerData(), 
			undoGameData())
		 .done(function(){
		 	//once data is loaded, refresh to get clean data
		 	socket.emit('undo');
			location.reload();
		});
	}
}


