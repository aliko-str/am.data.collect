const selfExt = require("sdk/self");
const tabs = require("sdk/tabs");
const io = require("sdk/io/file");
const tmr = require("sdk/timers");
const amReqAndSave = require("./am.req.and.save.data.js");
const { getMostRecentBrowserWindow } = require('sdk/window/utils');
const settings = require("./settings.js");

var _counter = 0;
function _processOneSearchPage(tab, currentComment, cb) {
	var ifExtractUrls = true;
	if(currentComment.id.indexOf(_sep) > -1){
		// no need for other-comment-page discovery
		ifExtractUrls = false;
	}else{
		// this is the first page: we do need to discover other pages
		ifExtractUrls = true;
	}
	console.log("ATTACHING a worker TO the BOOK DETAIL page...");
	var _fuckYouAmazonReload = true;
	var worker = tab.attach({
		contentScript : ";",
		contentScriptFile : [selfExt.data.url("jquery-2.1.3.min.js"), selfExt.data.url("am.parse.comment.page.js")],
		attachTo : "top",
		contentScriptWhen: "ready",
		contentScriptOptions: {ifExtractUrls: ifExtractUrls} 
	});
	worker.port.on("hello", function(msg) {
		_fuckYouAmazonReload = false;
		worker.port.emit("run");
		console.log(msg);
		return;
	});
	worker.port.on("data", function(data) {
		if(data){
			console.log("BOOK received. ");
		}
		worker.destroy();
		return cb(data.allComments, data.newPages);
	});
	worker.port.on("captcha", function(){
		_fuckYouAmazonReload = false;
		// TODO finish -- wait for a button click and reload the tab
		// TODO wait, let's see if Amazon reloads the page automatically after I enter the captcha
		console.log("captcha signal received");
	});
	tmr.setTimeout(function(){
		console.log("ATTENTION comment RELOAD: _fuckYouAmazonReload outside: ", _fuckYouAmazonReload);
		if(_fuckYouAmazonReload){
			console.log("ATTENTION comment RELOAD: _fuckYouAmazonReload: ", _fuckYouAmazonReload);
			worker.destroy();
			getMostRecentBrowserWindow().gBrowser.selectedBrowser.reload();
		}
	}, settings.reloadTime);
}


const _sep = "_..__.._";
function extractAllComments(catFolder, bookToUrlDictionary, cbAllDone){
	if(!bookToUrlDictionary.length){
		return console.error("bookToUrlDictionary ARRAY IS EMPTY!");
	}
	if(catFolder){
		amReqAndSave.mkFolder(catFolder);
	}else{
		return console.error("NO FOLDER TO SAVE COMMENTS INTO");
	}
	var currentComment = bookToUrlDictionary.shift();
	
	return tabs.open({
		url : currentComment.url,
		onReady: function(theTab) {
			// set-up worker attaching for each url
			_processOneSearchPage(theTab, currentComment, function(allComments, newPages) {
				// add other comment pages to the qeue to be checked
				if(newPages){
					for(var i = 0; i < newPages.length; i++){
						bookToUrlDictionary.push({id: currentComment.id + _sep + i, url: newPages[i]});
					}
				}
				// save the comments in a file
				if(allComments && allComments.length){
					var strToSave = amReqAndSave.arrToTabTable(allComments);
					amReqAndSave.writeDataToFile(strToSave, io.join(catFolder, currentComment.id + ".txt"), "w");
				}
				// if there are comments to process, do the recursion
				if(bookToUrlDictionary.length) {
					currentComment = bookToUrlDictionary.shift();
					theTab.url = currentComment.url;
				} else {
					cbAllDone();
					theTab.close();
				}
			});
			console.log("FIRE READY FOR a book detail ", _counter++, " URL: ", theTab.url);
		}
	});
	
	// 1 - open first page
	// 2 - scrap the list of pages to open
	// 3 - add the page in the beginning of dictionary of arrays
	// 4 - extract all comments
}

module.exports = {
	extractAllComments : extractAllComments
};
