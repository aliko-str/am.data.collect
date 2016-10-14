(function run() {
	const _debug = false;
	self.port.emit("hello", "HI from the client script for COMMENTS. URL: " + window.location.href);
	self.port.on("run", function(){
		if(_debug){
			console.log("ABOUT TO RUN page COMMENT Extraction");
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
	var data = {
		allComments: [],
		newPages: []
	};
	
	if($("div#cm_cr-view_opt").length < 1){
		// Amazon is probably asking for Captcha -- let's signal to the addon script
		return "captcha";
	}
	
	if(self.options.ifExtractUrls){
		var jqUrls = $("div#cm_cr-pagination_bar li.page-button").not("li.a-selected");
		data.newPages = jqUrls.map(function(){
			return $(this).find("a")[0].href;
		}).toArray();
	}
	
	data.allComments = getCommentArr();
	return data;
}





function getCommentArr(){
	// var commArr = jqRoot.find("div#revMHRL > div").find("div.a-section").map(function(){
		// return $(this).text().trim().replace(/\t/g, "").replace(/\n/g, "");
	// });
	//  
	
	
	
	// var commArr = $("div#cm_cr-review_list > div.a-section.review").map(function(){
		// var aComment = {};
		// var jqThis = $(this);
		// aComment.text = jqThis.find("span.review-text").text().trim().replace(/\t/g, "").replace(/\n/g, "");
		// aComment.date = jqThis.find("span.review-date").text().trim();
		// aComment.stars = jqThis.find("i.review-rating").text().trim();
		// aComment.helpf = jqThis.find("span.review-votes").text().trim().replace("people found this helpful.", "").replace("One person found this helpful.", "1") || "0";
		// aComment.title = jqThis.find("a.review-title").text().trim();
		// return aComment;
	// });

	var commArr;
	
	if($("div#revMHRL").length){
		commArr = $("div#revMHRL > div.a-section").map(function(){
			var aComment = {};
			var jqThis = $(this);
			aComment.text = jqThis.find("div.a-row > div.a-section").text().trim().replace(/\t/g, "").replace(/\n/g, "");
			aComment.date = jqThis.find("span.a-color-secondary > span.a-color-secondary").text().trim();
			aComment.stars = jqThis.find("i.a-icon-star").text().trim();
			aComment.helpf = jqThis.find("span.votingStripe > span.a-size-base").text().trim().replace("found this helpful. Was this review helpful to you?              Yes No", "").substring(0, 10) || 0;
			aComment.title = jqThis.find("div.a-icon-row span.a-size-base").text().trim();
			return aComment;
		});		
	}else{
		commArr = $("div#cm_cr-review_list > div.a-section.review").map(function(){
			var aComment = {};
			var jqThis = $(this);
			aComment.text = jqThis.find("span.review-text").text().trim().replace(/\t/g, "").replace(/\n/g, "");
			aComment.date = jqThis.find("span.review-date").text().trim();
			aComment.stars = jqThis.find("i.review-rating").text().trim();
			aComment.helpf = jqThis.find("span.review-votes").text().trim().replace("people found this helpful.", "").replace("One person found this helpful.", "1") || "0";
			aComment.title = jqThis.find("a.review-title").text().trim();
			return aComment;
		});
}
	
	return commArr.toArray();
}