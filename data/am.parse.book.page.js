(function run() {
	self.port.emit("hello", "HI from the client script. URL: " + window.location.href);
	// if(!window.AmazonBookPiece2){
		// console.error("AmazonBookPiece2 isn't defined in the content script");
		// self.port.emit("error", "AmazonBookPiece2 isn't defined in the content script");
	// }
	// self.port.emit("data", doExtraction());
	

	self.port.on("run", function(){
		if(!window.AmazonBookPiece2){
			console.error("AmazonBookPiece2 isn't defined in the content script");
			self.port.emit("error", "AmazonBookPiece2 isn't defined in the content script");
		}
		console.log("ABOUT TO RUN page detail Extraction");
		self.port.emit("data", doExtraction());
	});
})();


function doExtraction(){
	const allBooks = [];
	const jqRoot = $("div.a-container[role='main']");

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
	
	var ifKindle = false, ifPaper = false;
	const priceRegEx = /\$[\d\.]+/;
	const onlyCountFormats = ["kindle", "hardcover", "paperback"];
	const allPrices = jqRoot.find("div#tmmSwatches").find("li").filter(function(){
		const innerHtml = $(this).text().toLowerCase();
		for(var aFormat of onlyCountFormats){
			if(innerHtml.indexOf(aFormat) > -1){
				if(aFormat == "kindle"){
					ifKindle = true;
				}else{
					ifPaper = true;
				}
				return true;
			}
		}
		return false;
	}).map(function(){
		const innerText = $(this).find("span.a-button-inner").text();
		var price = priceRegEx.exec(innerText)[0].replace("$","");
		price = parseFloat(price);
		return price;
	});
	// if no price is listed - don't count this book
	if(!allPrices.length){
		console.log("SKIPPING A BOOK: no price is listed.");
		return null;
	}
	
	var priceSum = 0;
	for(var i = 0; i < allPrices.length; i++){
		priceSum+= allPrices[i];
	}
	const avgPrice = priceSum/allPrices.length;
	
	const commentArr = jqRoot.find("div#revMHRL > div").find("div.a-section").map(function(){
		return $(this).text().trim().replace(/\t/g, "").replace(/\n/g, "");
	});
	
	return new window.AmazonBookPiece2(descr, avgPrice, commentArr, size, ifPaper, ifKindle);
}

// function getAllNRatings(jqRoot){
	// var nRating1, nRating2, nRating3, nRating4, nRating5;
	// jqRoot.find("table#histogramTable").find("tr").each(function(){
		// var jqThis = $(this);
		// // UNFINISHED
	// });
// }
