var deckOrder = ["3D", "3C", "3H", "3S", "4D", "4C", "4H", "4S", "5D", "5C", "5H", "5S", "6D", "6C", "6H", "6S", "7D", "7C", "7H", "7S", "8D", "8C", "8H", "8S", "9D", "9C", "9H", "9S", "10D", "10C", "10H", "10S", "JD", "JC", "JH", "JS", "QD", "QC", "QH", "QS", "KD", "KC", "KH", "KS", "AD", "AC", "AH", "AS", "2D", "2C", "2H", "2S"];


function check_move(cards, prevCards || []){
	var lastCardsPlayed = prevCards;
	var newCards = cards; 

	//Check if it's 4 cards, then see if it's a bomba!
	if(newCards.length === 4){
		var sortedArray = newCards.sort();
		if(sortedArray[0][0] === sortedArray[3][0]){
			return true;
		}
		//ADD ELSE IF HERE FOR 4 CARD STRAIGHTS
		else{
			return false; 
		}
	}
	//If singles, see if it's higher
	else if (newCards.length === 1 && (lastCardsPlayed.length === 1 || lastCardsPlayed.length === 0)) {
		//Do some shit here
	}
	else{
		return false; 
	}

	
	//Check if it's the correct # of cards
		//If singles, see if it's higher
		//If doubles, see if it's higher
		//If triples, see if it's higher
		//If it's a straight and not a flush, see if it's higher
		//If it's a straight flush, see if it's higher
		//Do the same for double straights

}
