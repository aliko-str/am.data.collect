// TODO per-start data
// TODO additional data for comments

(function run() {
	const _debug = false;
	self.port.emit("hello", "HI from the client script. URL: " + window.location.href);
	self.port.on("run", function(){
		if(!window.AmazonBookPiece2){
			self.port.emit("error", "AmazonBookPiece2 isn't defined in the content script");
		}
		if(_debug){
			console.log("ABOUT TO RUN page detail Extraction");
		}
		var data = doExtraction();
		if(data == "captcha"){
			self.port.emit("captcha");
		}else{
			self.port.emit("data", data);
		}
	});
})();

function doExtraction(){
	const allBooks = [];
	const jqRoot = $("div.a-container[role='main']");
	if($("img#d[alt='Dogs of Amazon']").length){
		// Book not found -- just skip it
		console.log("Book not found -- just skip it");
		return null;
	}
	
	if(jqRoot.find("h1#title, h1.parseasinTitle ").length < 1){
		// Amazon is probably asking for Captcha -- let's signal to the addon script
		return "captcha";
	}

	const descr = jqRoot.find("iframe#bookDesc_iframe").contents().find("div#iframeContent").text().trim().replace(/\n/g, "");
	
	const numOnlyRegx = /[\d]+/;
	var size = jqRoot.find("table#productDetailsTable").find("li").filter(function(){
		const thisText = $(this).text().trim(); 
		return (thisText.indexOf(" pages") > -1 || thisText.indexOf(" KB") > -1);
	});
	if(!size.length){
		size = "NA";
	}else{
		size = size.text().trim();
		var sizeNum = numOnlyRegx.exec(size)[0];
		if(size.indexOf(" pages") > -1){
			size = sizeNum + " pages";
		}else{
			size = sizeNum + " KB";
		}
	}
	
	// var ifKindle = false, ifPaper = false, avgPrice;
	const prices = getPrice(jqRoot);
	if(prices === null){
		// no price -- skip this book
		return null;
	}
	
	const commentArr = getCommentArr(jqRoot);
	const allRatings = getAllRatings(jqRoot);
	
	const commentUrl = jqRoot.find("div#revF").find("a").attr("href");
	
	return new window.AmazonBookPiece2(descr, commentArr, size, prices.paperPrice, prices.kindlePrice, prices.hardcPrice, allRatings, commentUrl);
}


function getAllRatings(jqRoot){
	var allRatings = {r1:0, r2:0, r3:0, r4:0, r5:0};
	var jqRatTable = jqRoot.find("table#histogramTable");
	var jqLinkStars = jqRatTable.find("td.a-nowrap > a.a-link-normal").filter(function(){
		return $(this).text().indexOf("%") > -1;
	});
	jqLinkStars.each(function(){
		var jqThis = $(this);
		allRatings["r" + jqThis.attr("title").substring(0,1)] = jqThis.text().replace("%","");
	});
	
	
	// var i = 0;
	// while(i++ < 5){
		// var aStarVal = jqRatTable.find("td.a-nowrap > a.a-link-normal");
		// if(aStarVal.length){
			// allRatings["r" + i] = aStarVal.text().trim().replace("%", "");
		// }else{
			// allRatings["r" + i] = 0;
		// }
	// }
	return allRatings;
}


function getCommentArr(jqRoot){
	// var commArr = jqRoot.find("div#revMHRL > div").find("div.a-section").map(function(){
		// return $(this).text().trim().replace(/\t/g, "").replace(/\n/g, "");
	// });
	//  
	// var commArr = jqRoot.find("div#cm-cr-review-list > div.review").map(function(){
		// var aComment = {};
		// var jqThis = $(this);
		// aComment.text = jqThis.find("span.review-text div.a-expander-content").text().trim().replace(/\t/g, "").replace(/\n/g, "");
		// aComment.date = jqThis.find("span.review-date").text().trim();
		// aComment.stars = jqThis.find("i.review-rating").text().trim();
		// aComment.helpf = jqThis.find("span.cr-vote span.review-votes").text().trim().replace("people found this helpful.", "") || "NA";
		// aComment.title = jqThis.find("a.review-title").text().trim();
		// return aComment;
	// });

	var commArr = jqRoot.find("div#revMHRL > div.a-section").map(function(){
		var aComment = {};
		var jqThis = $(this);
		aComment.text = jqThis.find("div.a-row > div.a-section").text().trim().replace(/\t/g, "").replace(/\n/g, "");
		aComment.date = jqThis.find("span.a-color-secondary > span.a-color-secondary").text().trim();
		aComment.stars = jqThis.find("i.a-icon-star").text().trim();
		aComment.helpf = jqThis.find("span.votingStripe > span.a-size-base").text().trim().replace("found this helpful. Was this review helpful to you?              Yes No", "").substring(0, 10) || 0;
		aComment.title = jqThis.find("div.a-icon-row span.a-size-base").text().trim();
		return aComment;
	});
	
	return commArr;
}


function getPrice(jqRoot){
	var ifMaxPrice = false;
	var paperPrice, kindlePrice, hardcPrice;
	
	const priceRegEx = /\$[\d\.]+/;
	const onlyCountFormats = ["kindle", "hardcover", "paperback"];
	function filterOnlyAcceptedFormats(self, mapF){
		const innerHtml = $(self).text().toLowerCase();
		for(var aFormat of onlyCountFormats){
			// I saw cases of not-new book prices -- filter them out
			if(innerHtml.indexOf(aFormat) > -1 && innerHtml.indexOf("from") == -1){
				if(aFormat == "kindle"){
					kindlePrice = mapF(self);
				}else if(aFormat == "hardcover"){
					hardcPrice = mapF(self);
				}else {
					paperPrice = mapF(self);
				}
			}
		}		
	}
	
	function _mapThePrice1(self){
		const innerText = $(self).find("span.a-button-inner").text();
		var price = priceRegEx.exec(innerText);
		if(price){
			price = price[0].replace("$","");
			price = parseFloat(price);
		}
		return price;		
	}
	
	function _mapThePrice2(self){
		// TODO Test if this branch works!!
		
		var innerText = $(self).find("span.a-size-base.mediaTab_subtitle").text().trim().split("-");
		console.log("All prices: ", innerText.join("||"));
		if(innerText.length > 1){
			// we will only consider the max price -- min price is for used copies, which is less interesting for us
			ifMaxPrice = true;
		}
		innerText = innerText[innerText.length-1];
		var price = priceRegEx.exec(innerText);
		if(price){
			price = price[price.length-1].replace("$","");
			price = parseFloat(price);
		}
		return price;
	}
	
	function _assignNAifNeeded(a){
		if(a === null || a === undefined){
			return "NA";
		}
		return a;
	}
	
	jqRoot.find("div#tmmSwatches").find("li span.format").each(function(){
		filterOnlyAcceptedFormats(this, _mapThePrice1);
	});
	
	// if no price is listed - don't count this book
	if(paperPrice == undefined && kindlePrice == undefined && hardcPrice == undefined){
		// there could be another format of an Amazon page -- let's try to extract from it
		jqRoot.find("ul#mediaTabs_tabSet").find("li").each(function(){
			filterOnlyAcceptedFormats(this, _mapThePrice2);
		});
		
		if(paperPrice == undefined && kindlePrice == undefined && hardcPrice == undefined){
			console.log("SKIPPING A BOOK: no price is listed.");
			return null;			
		}
	}
		
	paperPrice = _assignNAifNeeded(paperPrice);
	kindlePrice = _assignNAifNeeded(kindlePrice);
	hardcPrice = _assignNAifNeeded(hardcPrice);
	return {paperPrice: paperPrice, kindlePrice: kindlePrice, hardcPrice: hardcPrice};
}
