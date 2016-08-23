(function run() {
	console.log("HEELLOOO FROM THE CLIENT SCRIPT!!");
	self.port.emit("hello", "HI from the client script. URL: " + window.location.href);
	self.port.on("run", function(){
		if(!window.AmazonBookPiece1){
			console.error("AmazonBookPiece1 isn't defined in the content script");
			self.port.emit("error", " -- AmazonBookPiece1 isn't defined in the content script");
		}
		console.log("ABOUT TO RUN extraction");
		self.port.emit("data", doExtraction());
	});
})();

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}

function doExtraction(){
	var _bookCounter = 0;
	const allBooks = [];
	var pageNum = getQueryVariable("page");
	if(pageNum == undefined){
		console.log("Apparently this is the first page...");
		pageNum = 1;
	}
	$("li.s-result-item").each(function(){
		_bookCounter++;
		var jqOneItem = $(this);
		var jqSponsored = jqOneItem.find(".s-sponsored-list-header");
		if(jqSponsored.length){
			// sponsored item -- skip it
			return;
		}
		
		var ifBest = (jqOneItem.find("span.sx-bestseller-badge").length > 0);
		var title = jqOneItem.find("a.s-access-detail-page > h2").text().replace("\t", " ");
		var url = jqOneItem.find("a.s-access-detail-page").attr("href");
		var icoUrl = getIcoUrl(jqOneItem);
		var releaseDateStr =  jqOneItem.find("div.a-row.a-spacing-small > span.a-size-small.a-color-secondary").text();
		var rating = getRating(jqOneItem);
		var nRatings = getNRatings(jqOneItem);
		var positionInList = _bookCounter;
		allBooks.push(new window.AmazonBookPiece1(title, url, icoUrl, releaseDateStr, rating, nRatings, ifBest, positionInList, pageNum));
	});
	console.log("EXTRACTION FINISHED");
	return allBooks;
}

function getNRatings(jqItemRoot){
	var jqNRat = jqItemRoot.find("div.a-row.a-spacing-mini > a.a-size-small.a-link-normal.a-text-normal[href*='customerReviews']");
	if(!jqNRat.length){
		console.log("We don't have the number of RATINGS -- return 0");
		return 0;
	}
	var nRat = jqNRat.text();
	nRat = parseInt(nRat);
	if(isNaN(nRat)){
		throw new Error("Can't parse the number of ratings -- not a number");
	}
	return nRat;
}

function getRating(jqItemRoot){
	var jqRating = jqItemRoot.find("i.a-icon-star > span");
	if(!jqRating.length){
		console.log("We don't have a raring -- return 0");
		return 0;
	}
	var rating = jqRating.text();
	rating = rating.split(" ");
	rating = window.parseInt(rating[0], 10);
	if(isNaN(rating)){
		throw new Error("Rating is not a number: ", jqRating.text());
	}
	return rating;
}

function getIcoUrl(jqItemRoot){
	var icoUrl = jqItemRoot.find("img.s-access-image").attr("srcset");
	icoUrl = icoUrl.split(",");
	// .filter(function(el){
		// return el.indexOf(" 3x") > -1;
	// });
	if(icoUrl.length < 1){
		console.error("Couldn't get an icon url");
		throw new Error("Couldn't get an icon url");
		icoUrl = jqItemRoot.find("img.s-access-image").attr("src");
		
	}else{
		icoUrl = icoUrl[icoUrl.length-1];
		icoUrl = icoUrl.trim().split(" ")[0];
	}
	return icoUrl;
}
