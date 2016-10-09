var db = require("./models");

var game = {
	name: "Chinese Poker Test",
	previousRoundOfMoves: [],
	isActive: true,
	moveCounter: 0
}

var players = [{
  name: "Teddy",
  cardsInHand: ["6C","10C","QC","3D","5D","9D","QD","3H","4H","7H","7S","8S","JS"],
  order: 0
},
{
	name: "Moy",
  cardsInHand: ["3C","9C","JC","AC","2D","4D","7H","8H","2S","5S","QS","KS","AS"],
  order: 1
},
{
	name: "Ran",
  cardsInHand: ["4C","KC","7D","10D","10H","QH","KH","AH","3S","4S","6S","9S","10S"],
  order: 2
},
{
	name: "DJ",
  cardsInHand: ["2C","5C","7C","8C","6D","8D","JD","KD","AD","2H","5H","6H","9H"],
  order: 3
}];


db.Game.remove({}, function(err, games){
	db.Player.remove({}, function(err,players2){
		db.Game.create(game, function(err, game){
	    if (err) { return console.log('ERROR', err); }
	    console.log("all games:", game);
	    players.forEach(function(element){
	    	element["game"] = game._id;
	    });
	    db.Player.create(players,function(err,players){
				console.log("all players:", players);
	    	process.exit();
	    })
	  });
	})
});