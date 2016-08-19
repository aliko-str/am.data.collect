"use strict";
var ffPref = require("sdk/preferences/service");
ffPref.set("javascript.options.strict", false);
ffPref.set("network.http.use-cache", false);
ffPref.set("browser.cache.memory.enable", false);

const settings = require("./settings.js");

const buttons = require('sdk/ui/button/action');

const amListings = require("./am.get.book.lists.js");
const aReqAndSave = require("./am.req.and.save.data.js");
const amGetBookDetail = require("./am.get.book.detail.js");
const amUrl = require("./am.urls.js");
const allUrlObj = amUrl.getAllUrlAsObj();

const button = buttons.ActionButton({
	id : "mozilla-link",
	label : "Run Amazon scrapping",
	icon : {
		"16" : "./icon-16.png"
	},
	onClick : runItAll
});


function doEachCategoryRecursively(_catCounter, allResObj, cbAllCatsDone){
	const catNames = Object.keys(allUrlObj);
	amListings.processUrlBatch(allUrlObj[catNames[_catCounter]], function(oneCatResults){
		allResObj[catNames[_catCounter]] = oneCatResults;
		if((_catCounter + 1) < catNames.length){
			doEachCategoryRecursively(_catCounter + 1, allResObj, cbAllCatsDone);
		}else{
			cbAllCatsDone();
		}
	});
}

function runItAll(state) {
	console.log("RUN clicked.");
	doEachCategoryRecursively(0, {}, function(allResObj){
		aReqAndSave.saveBookArrInTabTables(allResObj, amListings.AmazonBookPiece1.getHeader());
		aReqAndSave.reqAndSaveAllPngs(allResObj, function(reportObj){
			amGetBookDetail.processAllCats(allResObj, function(resultObj){
				// we are done here -- all is saved;
				console.log("DONE COMPLETELY");
			});
		});
	});
}