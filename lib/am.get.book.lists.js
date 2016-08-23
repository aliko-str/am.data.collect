const AmazonBookPiece1 = require("./am.urls.js").AmazonBookPiece1;
const selfExt = require("sdk/self");
const tabs = require("sdk/tabs");
const tmr = require("sdk/timers");
const { getMostRecentBrowserWindow } = require('sdk/window/utils');
var pageMods = require("sdk/page-mod");

var _counter = 0;
function processUrlBatch(urlArr, cbThatGetFinalResult) {
	if(!urlArr.length){
		return console.error("URL ARRAY IS EMPTY!");
	}
	var finalResult = [];
	return tabs.open({
		url : urlArr.shift(),
		onReady: function(theTab) {
			// set-up worker attaching for each url
			_processOneSearchPage(theTab, function(onePageRes) {
				finalResult = finalResult.concat(onePageRes);
				if(urlArr.length) {
					theTab.url = urlArr.shift();
				} else {
					finalResult = finalResult.map(function(piece1){
						return AmazonBookPiece1.fixMethods(piece1);
					});
					cbThatGetFinalResult(finalResult);
					theTab.close();
				}
			});
			console.log("FIRE READY ", _counter++, " URL: ", theTab.url);
		}
	});
}

function _processOneSearchPage(tab, cb) {
	console.log("ATTACHING a worker TO the Listing page...");
	var _fuckYouAmazonReload = true;
	var worker = tab.attach({
		contentScript : AmazonBookPiece1.toSource1() + ";",
		contentScriptFile : [selfExt.data.url("jquery-2.1.3.min.js"), selfExt.data.url("am.parse.listing.js")],
		attachTo : "top",
		contentScriptWhen: "ready"
	});
	worker.port.on("hello", function(msg) {
		_fuckYouAmazonReload = false;
		worker.port.emit("run");
		console.log(msg);
		return;
	});
	worker.port.on("data", function(data) {
		console.log("DATA LENGTH: ", data.length);
		worker.destroy();
		return cb(data);
	});
	tmr.setInterval(function(){
		if(_fuckYouAmazonReload){
			worker.destroy();
			getMostRecentBrowserWindow().gBrowser.selectedBrowser.reload();
		}
	}, 2000);
}

module.exports = {
	processUrlBatch : processUrlBatch
};
