var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var playerSchema = new Schema({
  name: String,
  cardsInHand: [],
  game: Schema.Types.ObjectId,
  order: Number
});

var Player = mongoose.model('Player', playerSchema);

module.exports = Player;
