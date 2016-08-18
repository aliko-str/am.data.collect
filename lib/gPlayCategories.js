var util = require("./util.js");

//var gPlayCategories = ["business"];//, "education", "lifestyle", "media_and_video", "shopping", "travel_and_local", "news_and_magazines"];
// var gPlayCategories = ["media_and_video", "shopping", "travel_and_local", "news_and_magazines"];
// var gPlayCategoriesReg = ["lifestyle", "media_and_video", "shopping", "travel_and_local", "news_and_magazines"];
const gPlayCategories = ["shopping"]; 

function getGPlayCatTopUrl(catName) {
	if(!catName)
		throw new Error("category name should be a string");
	var gPlayTopTmpl = "https://play.google.com/store/apps/category/<%cat%>/collection/topselling_free";
	return util.interpolate(gPlayTopTmpl, {
		cat : catName.toUpperCase()
	});
}

function getGPlayCatSearchUrl(catName) {
	if(!catName)
		throw new Error("category name should be a string");
	var _emptySpace = encodeURIComponent(" ");
	var gPlaySearchTmpl = "https://play.google.com/store/search?q=<%cat%>%20apps&c=apps";
	catName = catName.replace("_", _emptySpace);
	return util.interpolate(gPlaySearchTmpl, {
		cat : catName
	});
}

module.exports = {
	_getGPlayUrls : function(isTopApps) {
		var getF = getGPlayCatSearchUrl;
		if(isTopApps) {
			getF = getGPlayCatTopUrl;
		}
		var result = [];
		for(var i = 0, ilen = gPlayCategories.length; i < ilen; i++) {
			var obj = {
				"cat" : gPlayCategories[i],
				"url" : getF(gPlayCategories[i]),
				"isTop" : isTopApps
			};
			result.push(obj);
		}
		return result;
	},
	getGPlayRegularUrls : function() {
		return this._getGPlayUrls(false);
	},
	getGPlayTopUrls : function() {
		return this._getGPlayUrls(true);
	},
	getGPlayCategories: function(){
		return gPlayCategories;
	}
};

