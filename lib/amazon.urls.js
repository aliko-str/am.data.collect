const util = require("./util.js");
const settings = require("./settings.js");

const amazonSearchUrl = "https://www.amazon.com/s/ref=nb_sb_noss_2?field-keywords=Science+Fiction+%26+Fantasy+books&page=2";
const amazonCats = ["Arts & Photography", "Business & Money", "Children's Books", "Education & Teaching", "Travel", "Politics & Social Sciences", "History", "Humor & Entertainment", "Science Fiction & Fantasy"];

function buildAmazonSearchUrl(cat, pageNum){
	// TODO finish
}

function AmazonBook(catName, iconUrl, title, rating, nRatings, pricePaperBack, discountedPrice, formatArr, releaseDateStr, positionInList){
	this.catName = catName; 
	this.iconUrl = iconUrl; 
	this.title = title; 
	this.rating = rating; 
	this.nRatings = nRatings; 
	this.pricePaperBack = pricePaperBack; 
	this.discountedPrice = discountedPrice; 
	this.formatArr = formatArr; 
	this.releaseDateStr = releaseDateStr; 
	this.id = positionInList;
	this.toString = function(){
		// TODO finish
	};
}

AmazonBook.getWritableProperties = function(){
	// TODO finish.
}

AmazonBook.getHeader = function(){
	
	// TODO finish
};

// TODO paperback or hardcover Only

// TODO Book icon <-- fetch and save
 


function AmazonCategory(catName){
	this.catName = catName;
	this.searchTerm = catName + " books";
	this.searchUrls = [];
	for(var i = 1; i < settings.MAX_NUM_SEARCH_PAGE; i++){
		this.searchUrls.push(buildAmazonSearchUrl(this.catName, i));
	}
	this._allBooks = [];
	this.addBook = function(amazonBook){
		return this._allBooks.push(amazonBook);
	};
	this.toString = function(){
		
	};
}

module.exports = {
	allAmazonData : function() {
	}
};
