const gPlayBaseUrl = "https://play.google.com/store/";
// var sprintf = require("sprintf.js").sprintf;

function App(name, url, isTop, rank, iconUrl) {
	function _cleanStr(aStr){
		return aStr.replace(/[\.:\/]*/g, "");
	};
	name = _cleanStr(name);
	this.name = name;
	this.url = url;
	this.isTop = isTop;
	this.rank = -1;
	if(isTop) {
		if(rank < 1) {
			throw new Error("This is an app from the top-apps list -- it shall have a rank");
		}
		this.rank = rank;
	}
	this.iconUrl = iconUrl;
	this.icoName = name + "_ico_.png";
	this.ssUrls = [];
	this.scores = {
		"1" : null,
		"2" : null,
		"3" : null,
		"4" : null,
		"5" : null,
		"all" : null
	};
	this.avScore = null;
	this.numOfInstallsCategory = "";
	this.realCategory = "";
}

App.restore = function(appObj){
	return new App(appObj.name, appObj.url, appObj.isTop, appObj.rank, appObj.iconUrl);
};

App.getHeader = function(){
	return "name\trank\tuRaterNum1\tuRaterNum2\tuRaterNum3\tuRaterNum4\tuRaterNum5\tuRaterNumAll\tuScoreAvg\tinstallCat\trealCat\ticoName";
};

App.prototype.toString = function(){
	var record = [this.name, this.rank, this.scores['1'], this.scores['2'], this.scores['3'], this.scores['4'], this.scores['5'], this.scores['all'], this.avScore, this.numOfInstallsCategory, this.realCategory, this.icoName].join("\t");
	return record;
};

App.prototype.extend = function(appAddInfoObj) {
	// fool check: if appAddInfoObj contains all the properties we need
	var namesToCheck = ["ssUrls", "scores", "avScore", "numOfInstallsCategory", "realCategory"];
	var incomingKeys = Object.keys(appAddInfoObj);
	if(namesToCheck.filter(function(el, i) {
		return incomingKeys.indexOf(el) == -1;
	}).length) {
		console.log("appAddInfoObj keys: " + Object.keys(appAddInfoObj).join(", "));
		throw new Error("NOt all required properties are in the appAddInfoObj");
	}
	// END fool check: if appAddInfoObj contains all the properties we need
	this.ssUrls = appAddInfoObj.ssUrls;
	this.avScore = appAddInfoObj.avScore;
	this.numOfInstallsCategory = appAddInfoObj.numOfInstallsCategory;
	for(var i in this.scores) {
		this.scores[i] = appAddInfoObj.scores[i];
	}
	this.realCategory = appAddInfoObj.realCategory;
	return this;
};

module.exports = {
	App : App
};
