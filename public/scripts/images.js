function images(card){
	var value;
	var suit;
	card.length === 3 ? value = card.substring(0,2) : value = card[0];
	suit = card[card.length-1];

	switch(value) {
		case "J":
			value = "jack"
			break;
		case "Q":
			value = "queen"
			break;
		case "K":
			value = "king"
			break;
		case "A":
			value = "ace"
			break;
		default:
			value;
	}

	switch(suit) {
		case "D":
			suit = "diamonds"
			break;
		case "C":
			suit = "clubs"
			break;
		case "H":
			suit = "hearts"
			break;
		case "S":
			suit = "spades"
			break;
	}

	if (value === "king" || value === "queen" || value === "jack"){
		return "/img/" + value + "_of_" + suit +"2.png"
	}
	else{
		return "/img/" + value + "_of_" + suit +".png"
	}
}
