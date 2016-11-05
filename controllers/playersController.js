var db = require('../models');

function playersIndex(request,response){
	db.Player.find({},function(err, players){
		response.send(players);
	});
}

function showPlayers(request,response){
	db.Player.find({game: request.params.game_id},function(err, players){
		response.send(players);
	});
}

function showPlayer(request,response){
	db.Player.findOne({_id: request.params.id, game: request.params.game_id},function(err, player){
		response.send(player);
	});
}

function showOpponents(request,response){
	db.Player.find({_id: {$ne: request.params.id}, game: request.params.game_id},function(err, players){
		response.send(players);
	});
}

function postPlayers(request,response){
	db.Player.insertMany(request.body.array,function(err,playerArray){
		response.send(playerArray);
	});
}

function playCardToDB(request,response){
	db.Player.findOne({_id: request.params.id, game: request.params.game_id},function(err, player){
		request.body.cards.forEach(function(card){
			var index = player.cardsInHand.indexOf(card);
			if (index >= 0 ){
				player.cardsInHand.splice(index,1);
			}
			console.log(index);
		})
		player.save();
		response.send(player);
	});
}

function undoLastMoveForPlayer(request,response){
	db.Player.findOne({_id: request.params.id, game: request.params.game_id},function(err, player){
		request.body.cards.forEach(function(card){
			player.cardsInHand.push(card);
		});
		player.save();
		response.send(player);
	});
}

// export public methods here
module.exports = {
  playersIndex: playersIndex,
  showPlayers: showPlayers,
  showPlayer: showPlayer,
  showOpponents: showOpponents,
  postPlayers: postPlayers,
  playCardToDB: playCardToDB,
  undoLastMoveForPlayer: undoLastMoveForPlayer
};