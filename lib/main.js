"use strict";
var ffPref = require("sdk/preferences/service");
ffPref.set("javascript.options.strict", false);
ffPref.set("network.http.use-cache", false);
ffPref.set("browser.cache.memory.enable", false);

var settings = {
	appsToSelectPerCategory : 1000,
	debug : true,
	baseFolder : "~/Users/Aleksii/Projects/scrap.amazon/",
	ssMinSizes : {
		// width : 480,
		// height : 800
		width : 320,
		height : 480
	},
	minSsNum : 5
};
var buttons = require('sdk/ui/button/action');
var getAppListAndIcons = require("./getAppListsAndIcons.js");
var gPlayCatUrlGetter = require("./gPlayCategories.js");
var reqAndSaveImg = require("./reqAndSaveImg.js").init(settings, gPlayCatUrlGetter.getGPlayCategories());
var getAppSsLists = require("./getAppSsLists.js");
var textHandler = require("./handleTextRecords.js").init(settings);

var button = buttons.ActionButton({
	id : "mozilla-link",
	label : "Run Amazon scrapping",
	icon : {
		"16" : "./icon-16.png"
	},
	onClick : runItAll
});

var gPlayCategoryUrls = {
	topApps : gPlayCatUrlGetter.getGPlayTopUrls(),
	regularApps : gPlayCatUrlGetter.getGPlayRegularUrls()
};

function runItAll(state) {
	console.log("RUN clicked.");
	// data for testing:
	var tData = gPlayCategoryUrls.topApps.concat(gPlayCategoryUrls.regularApps);
	getAppListAndIcons.gatherCatInfo(tData, settings, function(catArr) {
		function visitAndCleanOutAppsOfACat(_syncKeys) {
			var _key = _syncKeys.shift();
			if(!_key) {
				return console.log("WE should be done for now!");
			}
			getAppSsLists.populateAppSsLists(catArr[_key].appArr, settings, function(appArr) {
				// console.log("Category", catArr[_key].catObj.cat, " - OLD appArr length: ", catArr[_key].appArr.length, " NEW length: ", appArr.length);
				catArr[_key].appArr = appArr;
				reqAndSaveImg.saveAppArrIcons(catArr[_key].appArr, function(){
					// TODO deal with each category one-by-one for the case of crash in the middle of scrapping
					reqAndSaveImg.saveSSofAllApps(catArr[_key].catObj.cat, catArr[_key].appArr, function(){
						textHandler.saveACategory(catArr[_key].catObj, catArr[_key].appArr);
						return visitAndCleanOutAppsOfACat(_syncKeys);
					});
				});
				return;
			});
		}
		visitAndCleanOutAppsOfACat(Object.keys(catArr));
	});
}