(function run() {
	self.port.emit("hello", "HI from the client script. URL: " + window.location.href);
	if(!window.AmazonBookPiece2){
		console.error("AmazonBookPiece2 isn't defined in the content script");
		self.port.emit("error", "AmazonBookPiece2 isn't defined in the content script");
	}
	self.port.emit("data", doExtraction());
})();


function doExtraction(){
	const allBooks = [];
	const jqRoot = $("div.a-container[role='main']");

	const descr = jqRoot.find("iframe#bookDesc_iframe div#iframeContent").text().trim().replace(/\n/g, "");
	
	const numOnlyRegx = /[\d]+/;
	var size = jqRoot.find("table#productDetailsTable").find("li").filter(function(){
		return ($(this).text().indexOf(" pages") > -1);
	}).text();
	size = numOnlyRegx.exec(size)[0];
	
	const priceRegEx = /\$[\d\.]+/;
	const onlyCountFormats = ["kindle", "hardcover", "paperback"];
	const allPrices = jqRoot.find("div#tmmSwatches").find("li").filter(function(){
		const innerHtml = $(this).text().toLowerCase();
		for(var aFormat of onlyCountFormats){
			if(innerHtml.indexOf(aFormat) > -1){
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
	const priceSum = 0;
	for(var i = 0; i < allPrices.length; i++){
		priceSum+= allPrices[i];
	}
	const avgPrice = priceSum/allPrices.length;
	
	const commentArr = jqRoot.find("div#revMHRL > div").find("div.a-section").map(function(){
		return $(this).text().trim().replace(/\t/g, "").replace(/\n/g, "");
	});
	
	return new window.AmazonBookPiece2(descr, avgPrice, commentArr, size);
}

// function getAllNRatings(jqRoot){
	// var nRating1, nRating2, nRating3, nRating4, nRating5;
	// jqRoot.find("table#histogramTable").find("tr").each(function(){
		// var jqThis = $(this);
		// // UNFINISHED
	// });
// }
