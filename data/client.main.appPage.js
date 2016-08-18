var gSettings;

(function run() {
	self.port.emit("msg", "appPage.client started");
	self.port.on("settings", function(settings) {
		gSettings = settings;
		$(function(ev) {
			extractAll(function(appInfoObj) {
				self.port.emit("done", appInfoObj);
			});
		});
	});
})();

function extractAll(callback) {
	var allSs = $("img.full-screenshot").filter(function(i, el) {
		// console.log("el.naturalWidth:  ", el.naturalWidth, " -- el.naturalHeight", el.naturalHeight);
		if(el.naturalWidth < el.naturalHeight && el.naturalWidth >= gSettings.ssMinSizes.width && el.naturalHeight >= gSettings.ssMinSizes.height) {
			return true;
		}
		return false;
	});
	if(allSs.length < gSettings.minSsNum){
		if(gSettings.debug){
			console.log("NOT Enough appropriate screenshots ", allSs.length, " for the app ", window.location.href);
		}
		return callback(null);
	}
	var scores = {};
	$("div.rating-bar-container").each(function(i, el) {
		el = $(el);
		var score = el.find("span.bar-label").text().replace(/\s*/g, "");
		var numOfRaters = el.find("span.bar-number").text().replace(",","");
		scores[score] = numOfRaters;
	});
	scores["all"] = $("span.reviews-num").text().replace(",","");
	var appAddInfo = {
		ssUrls: allSs.map(function(i, el){
			return $(el)[0].src;
		}),
		avScore: $("div.score").text(),
		numOfInstallsCategory: $("div.content[itemprop='numDownloads']").text().replace(/\s*/g,""),
		realCategory: $("div.info-container").find("span[itemprop='genre']").text().replace(/\s*/g,""),
		scores: scores
	};
	return callback(appAddInfo);
}
