/******************
 * Initialization *
 ******************/
var express = require('express'),
	app = express(),
	mongoose = require('mongoose');

var http = require('http').Server(app);
var io = require('socket.io')(http);

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

/************
 * DATABASE *
 ************/

var db = require('./models');

/**********
 * ROUTES *
 **********/

 /*
 * Middleware
 */

app.use(express.static('public'));

 /*
 * HTML Endpoints
 */

//Get homepage
app.get('/', function homepage(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

//Get gamepage
app.get('/game/:game_id/players/:player_id', function tourPage(request, response) {
  response.sendFile(__dirname + '/views/game.html');
});

//Get info about ALL games
app.get('/api/games', function(request,response){
	db.Game.find({},function(err, games){
		response.send(games);
	});
});

//Get info about ALL players
app.get('/api/players', function(request,response){
	db.Player.find({},function(err, players){
		response.send(players);
	});
});

//Get info about the game
app.get('/api/:game_id', function(request,response){
	db.Game.findOne({_id: request.params.game_id},function(err, game){
		response.send(game);
	});
});

//Get info about all players
app.get('/api/:game_id/players/', function(request,response){
	db.Player.find({game: request.params.game_id},function(err, players){
		response.send(players);
	});
});

//Get info about a specific player
app.get('/api/:game_id/players/:id', function(request,response){
	db.Player.findOne({_id: request.params.id, game: request.params.game_id},function(err, player){
		response.send(player);
	});
});

//Get info about all other players
app.get('/api/:game_id/players/excluding/:id', function(request,response){
	db.Player.find({_id: {$ne: request.params.id}, game: request.params.game_id},function(err, players){
		response.send(players);
	});
});

//Play a card to the database
app.put('/api/:game_id/players/:id', function(request,response){
	db.Player.findOne({_id: request.params.id, game: request.params.game_id},function(err, player){
		request.body.cards.forEach(function(card){
			var index = player.cardsInHand.indexOf(card);
			player.cardsInHand.splice(index,1);
			console.log(index);
		})
		player.save();
		response.send(player);
	});
});

//Update move counter in the db
app.put('/api/:game_id/moveCounter', function(request,response){
	db.Game.findOne({_id: request.params.game_id},function(err,game){
		game.moveCounter++;
		game.save();
		response.send(game);
	});
});

//Initialize game in DB
app.post('/api/', function(request,response){
	console.log(request.body);
	var newGame = new db.Game (request.body);
	newGame.save();
	response.send(newGame);
});

//Initialize game in DB
app.post('/api/:game_id/players', function(request,response){
	db.Player.insertMany(request.body.array,function(err,playerArray){
		response.send(playerArray);
	});
});

 /**********
 * Socket *
 **********/
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('move', function(move){
  	console.log("received : " +  move);
    socket.broadcast.emit('move', move);
  });
});

/**********
 * SERVER *
 **********/

// listen on port 3000
http.listen(3000, function(){
  console.log('listening on *:3000');
});
