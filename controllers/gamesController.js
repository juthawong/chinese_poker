var db = require('../models');

function getGames(request,response){
	console.log('here');
	db.Game.find({},function(err, games){
		response.send(games);
	});
}

function showGame(request,response){
	db.Game.findOne({_id: request.params.game_id},function(err, game){
		response.send(game);
	});
}

function updateMoveCounterAndPreviousRounds(request,response){
	db.Game.findOne({_id: request.params.game_id},function(err,game){
		game.moveCounter++;
		game.previousRoundOfMoves = request.body.previousRoundOfMoves;
		game.save();
		response.send(game);
	});
}

function postGame(request,response){
	console.log(request.body);
	var newGame = new db.Game (request.body);
	newGame.save();
	response.send(newGame);
}

function undoLastMoveForGame(request,response){
	db.Game.findOne({_id: request.params.game_id},function(err,game){
		game.moveCounter--;
		game.previousRoundOfMoves = request.body.previousRoundOfMoves;
		game.save();
		response.send(game);
	});
}

// export public methods here
module.exports = {
  getGames: getGames,
  showGame: showGame,
  updateMoveCounterAndPreviousRounds: updateMoveCounterAndPreviousRounds,
  postGame: postGame,
  undoLastMoveForGame: undoLastMoveForGame
};