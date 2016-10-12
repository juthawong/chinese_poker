var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var gameSchema = new Schema({
  name: String,
  previousRoundOfMoves: [],
  isActive: Boolean,
  moveCounter: Number
});

var Game = mongoose.model('Game', gameSchema);

module.exports = Game;