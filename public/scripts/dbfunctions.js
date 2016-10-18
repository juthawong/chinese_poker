Player.prototype.getCardDataFromDatabase = function(){
	var self = this;
	return $.ajax({
		method: "GET",
		url: '/api/' + self.game_id + '/players/' + self.player_id,
		success: function(data){
			self.cardsInHand = data.cardsInHand;
			self.order = data.order;
			self.player_name = data.name;
		}
	});
}

Player.prototype.getMoveCounterAndRound = function() {
	var self = this;
	return $.ajax({
		method: "GET",
		url: '/api/' + self.game_id,
		success: function(game){
			self.moveCounter = game.moveCounter;
			self.previousRoundOfMoves = game.previousRoundOfMoves;
		}
	});
};

Player.prototype.getOpponentInfoFromDatabase = function(){
	var self = this;
	return $.ajax({
		method: "GET",
		url: '/api/' + this.game_id + '/players/excluding/' + this.player_id,
		success: function(opponentPlayers){
			opponentPlayers.forEach(function(opponentPlayer){
				self.opponentData.push({id: opponentPlayer._id, 
														 numCards: opponentPlayer.cardsInHand.length, 
														 name: opponentPlayer.name, 
														 order: opponentPlayer.order})
			});
		}
	});
}

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