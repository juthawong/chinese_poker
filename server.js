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

var controllers = require('./controllers');

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
app.get('/game/:game_id/players/:player_id', function gamePage(request, response) {
  response.sendFile(__dirname + '/views/game.html');
});

app.get('/api/games', controllers.games.getGames);
app.get('/api/:game_id', controllers.games.showGame);
app.put('/api/:game_id/moveCounter', controllers.games.updateMoveCounterAndPreviousRounds);
app.put('/api/:game_id/undo', controllers.games.undoLastMoveForGame); //TODO 
app.post('/api/', controllers.games.postGame);

app.get('/api/players', controllers.players.playersIndex);
app.get('/api/:game_id/players/', controllers.players.showPlayers);
app.get('/api/:game_id/players/:id', controllers.players.showPlayer);
app.get('/api/:game_id/players/excluding/:id', controllers.players.showOpponents);
app.post('/api/:game_id/players', controllers.players.postPlayers);
app.put('/api/:game_id/players/:id', controllers.players.playCardToDB);
app.put('/api/:game_id/players/:id/undo', controllers.players.undoLastMoveForPlayer); 

/**********
* Socket *
**********/
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('move', function(move){
    socket.broadcast.emit('move', move);
  });
  socket.on('undo',function(){
    console.log('undo move now');
    socket.broadcast.emit('undo');
  });
});

/**********
 * SERVER *
 **********/

// listen on port 3000
http.listen(3000, function(){
  console.log('listening on *:3000');
});
