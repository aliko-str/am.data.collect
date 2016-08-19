const util = require("./util.js");
const settings = require("./settings.js");
const tabs = require("sdk/tabs");
const selfExt = require("sdk/self");
const _s = settings;
if(_s.debug){
	_s.maxNumOfSearchPages = 2;
}

const baseUrl = "https://www.amazon.com/s/ref=nb_sb_noss_1?url=search-alias%3Dstripbooks&field-keywords={keywords}&page={pageNum}";

// const amazonSearchUrl = "https://www.amazon.com/s/ref=nb_sb_noss_2?field-keywords=Science+Fiction+%26+Fantasy+books&page=2";
const amazonCats = ["Arts & Photography", "Biographies & Memoirs", "Business & Money", "Education & Teaching", "Travel", "History", "Humor & Entertainment", "Sci-Fi & Fantasy", "Romance"];


function _buildAmazonSearchUrl(keywords, pageNum){
	keywords = keywords.replace(/ /g, "+").replace(/&/g, "%26");
	return baseUrl.replace("{keywords}", keywords).replace("{pageNum}", pageNum);
}

function AmazonBookPiece1(title, url, icoUrl, releaseDateStr, rating, nRatings, ifBest, positionInList, pageNum){
	this.title = title;
	this.url = url;
	this.icoUrl = icoUrl;
	this.releaseDateStr = releaseDateStr;
	this.rating = rating;
	this.nRatings = nRatings;
	this.ifBest = ifBest;
	this.positionInList = positionInList;
	this.pageNum = pageNum;
	this.id = (function(self){
		var _id = self.title.replace(/[^\w\d]/g, "-");
		if(AmazonBookPiece1._nameStore[_id]){
			console.log("Duplicate Title for : AmazonBookPiece1", _id);
		}
		return _id;
	})(this);
	this.toTabString = function(){
		var _props = AmazonBookPiece1.getWritableProperties;
		var _tabStr = "";
		for(var pr of _props){
			_tabStr = _tabStr + this[pr] + "\t";
		}
		return _tabStr;
	};
}
AmazonBookPiece1._nameStore = {};
AmazonBookPiece1.getWritableProperties =  ['url', "title", "rating", "nRatings", "releaseDateStr", "positionInList", "ifBest", "pageNum"];
AmazonBookPiece1.getHeader = function(){
	return AmazonBookPiece1.getWritableProperties.join("\t");
};

const idStore = {};
function AmazonBook(catName, piece1, piece2){
	this.catName = catName;
	// individual url to the page with the book details
	this.url = piece1.url; 
	this.title = piece1.title;
	this.icoUrl = piece1.icoUrl;
	this.releaseDateStr = piece1.releaseDateStr;
	this.rating = piece1.rating;
	this.bestSeller = piece1.ifBest;
	this.positionInList = piece1.positionInList;
	this.pageNum = piece1.pageNum;
	this.nRatings = piece1.nRatings;
	
	this.size = piece2.size;
	this.nRating1 = piece2.nRating1;
	this.nRating2 = piece2.nRating2;
	this.nRating3 = piece2.nRating3;
	this.nRating4 = piece2.nRating4;
	this.nRating5 = piece2.nRating5;
	this.avgPrice = piece2.avgPrice;  
	
	// save it in a separate file
	this.commentArr = piece2.commentArr;
	this.descr = piece2.descr;
	
	this.id;
	
	var _id = this.title.replace(/[^\w\d]/g, "-");
	if(idStore[_id]){
		console.log("Duplicate Title: ", _id);
		_id = this.catName + _id;
		if(idStore[_id]){
			console.log("Duplicate Title and Category: ", _id);
			_id = this.url.replace(/[^\w\d]/g, "-");
			if(idStore[_id]){
				console.error("Fuck... Identical everythign! We'll simply overwrite the data...");
			}
		}
	}
	this.id = _id;
	idStore[_id] = _id;
	
	this.getId = function(){
		return this.id;
	};
	
	this.toTabString = function(){
		var _props = AmazonBook.getWritableProperties;
		var _tabStr = "";
		for(var pr of _props){
			_tabStr = _tabStr + this[pr] + "\t";
		}
		return _tabStr;
	};
	
	this.commArrToStr = function(){
		var head = ["num", "text"].join("\t");
		var bodyArr = [head];
		for(var i = 0; i < this.commentArr.length; i++){
			bodyArr.push(["comment" + (i+1), this.commentArr[i].replace(/\t/g, " ")].join("\t"));
		}
		return bodyArr.join("\n");
	};
}
//  "nRating1", "nRating2", "nRating3", "nRating4", "nRating5",
AmazonBook.getWritableProperties = ['catName', 'url', "title", "rating", "nRatings", "avgPrice", "releaseDateStr", "positionInList", "size", "bestSeller", "pageNum"];

AmazonBook.getHeader = function(){
	return AmazonBook.getWritableProperties.join("\t");
};


function AmazonBookPiece2(descr, avgPrice, commentArr, size){
	this.size = size;
	this.nRatings = piece1.nRatings;
	// WE DON'T collect individual nRatings -- Amazon uses a complex algorithm to calculate Percentages and does not report individual counts.
	// this.nRating1 = nRating1;
	// this.nRating2 = nRating2;
	// this.nRating3 = nRating3;
	// this.nRating4 = nRating4;
	// this.nRating5 = nRating5;
	this.avgPrice = avgPrice;
	
	// save it in a separate file
	this.commentArr = commentArr;
	this.descr = descr;
	this.toTabString = function(){
		throw new Error("Shall not be used: we should use these type2 objects only to create the complete Book objects, not to save them in tabTables");
	};
}

function getAllUrlAsObj(){
	// Amazon gives out only 75 search pages max
	const allUrls = {};
	for(var cat of amazonCats){
		allUrls[cat] = [];
		const _keywords = cat + "books";
		for(var i = 1; i <= _s.maxNumOfSearchPages; i++){
			allUrls[cat].push(_buildAmazonSearchUrl(_keywords, i));
		}
	}
	return allUrls;
}

module.exports = {
	getAllUrlAsObj: getAllUrlAsObj,
	AmazonBook: AmazonBook,
	AmazonBookPiece1: AmazonBookPiece1,
	AmazonBookPiece2: AmazonBookPiece2
};