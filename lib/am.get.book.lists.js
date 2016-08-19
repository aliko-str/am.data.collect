const AmazonBookPiece1 = require("./am.urls.js").AmazonBookPiece1;
const selfExt = require("sdk/self");
const tabs = require("sdk/tabs");

function _getATab(cb) {
	return tabs.open({
		url : "https://www.google.it/",
		onOpen : cb
	});
}
function processUrlBatch(urlArr, cbThatGetFinalResult) {
	if(!urlArr.length){
		return console.error("URL ARRAY IS EMPTY!");
	}
	var finalResult = [];
	_getATab(function(theTab) {
		theTab.on("ready", function(tab) {
			// set-up worker attaching for each url
			_processOneSearchPage(tab, function(onePageRes) {
				finalResult = finalResult.concat(onePageRes);
				if(urlArr.length) {
					theTab.url = urlArr.shift();
				} else {
					cbThatGetFinalResult(finalResult);
					theTab.close();
				}
			});
		});
		// start the recursive process
		theTab.url = urlArr.shift();
	});
}

function _processOneSearchPage(tab, cb) {
	console.log("ATTACHING a worker TO the Listing page...");
	var worker = tab.attach({
		contentScriptFile : [selfExt.data.url("jquery-2.1.3.min.js"), selfExt.data.url("am.parse.listing.js")],
		contentScript : "window.AmazonBookPiece1 = " + AmazonBookPiece1.toSource() + ";",
		attachTo : "top"
	});
	worker.port.on("hello", function(msg) {
		console.log(msg);
		return;
	});
	worker.port.on("data", function(data) {
		console.log("DATA LENGTH: ", data.length);
		return cb(data);
	});
}

module.exports = {
	processUrlBatch : processUrlBatch
};
