var mongoose = require("mongoose");
mongoose.connect( process.env.MONGODB_URI || "mongodb://localhost/chinese-poker");

module.exports.Player = require("./playerSchema.js");
module.exports.Game = require("./gameSchema.js");

