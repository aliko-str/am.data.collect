const io = require("sdk/io/file");
const AmazonBookPiece2 = require("./am.urls.js").AmazonBookPiece2;
const AmazonBook = require("./am.urls.js").AmazonBook;
const selfExt = require("sdk/self");
const tabs = require("sdk/tabs");
const tmr = require("sdk/timers");
const amReqAndSave = require("./am.req.and.save.data.js");
const { getMostRecentBrowserWindow } = require('sdk/window/utils');
const settings = require("./settings.js");
const amGetBookComments = require("./am.get.book.comments.js");


function processAllCats(piece1BookArrObj, cbAllDone){
	const catNames = Object.keys(piece1BookArrObj);
	const resultObj = {};
	const commentFolders = amReqAndSave.getCommentFolders(catNames);
	function __codeWrapper(currCat){
		_processACategory(currCat, piece1BookArrObj[currCat], function(bookArrOneCat){
			resultObj[currCat] = bookArrOneCat;
			// save the results -- I expect the addon to fall once in a while, so we better save the data we already have and restart later without the saved categories
			amReqAndSave.saveBooksForOneCatInTabTables(currCat + "_full", bookArrOneCat, AmazonBook.getHeader());
			// save all comment arrays for all Books in separate files
			bookArrOneCat.forEach(function(aBook){
				amReqAndSave.writeDataToFile(aBook.commArrToStr(), io.join(commentFolders[currCat], aBook.id + ".txt"), "w");
			});
			// prepar to collect all comments <-- need to be opened in a separate tab
			const bookIDsAndCommUrls = []; // <-- use this to extract all comments later
			bookArrOneCat.forEach(function(aBook){
				if(aBook.commentUrl){
					bookIDsAndCommUrls.push({id: aBook.id, url: aBook.commentUrl});
				}
			});
			// start a recursive exraction of comments
			amGetBookComments.extractAllComments(commentFolders[currCat] + "_all", bookIDsAndCommUrls, function(){
				// restart recursion if needed
				if(catNames.length){
					__codeWrapper(catNames.shift());
				}else{
					cbAllDone(resultObj);
				}
			});
		});		
	}
	__codeWrapper(catNames.shift());
}

var _counter = 0;
function _processACategory(catName, piece1BookArr, cbThatGetFinalResult) {
	if(settings.debug){
		piece1BookArr = piece1BookArr.slice(0,6);
	}
	if(!piece1BookArr.length){
		return console.error("piece1BookArr ARRAY IS EMPTY!");
	}
	var finalResult = [];
	var currentPiece1Book = piece1BookArr.shift();
	
	return tabs.open({
		url : currentPiece1Book.url,
		onReady: function(theTab) {
			// set-up worker attaching for each url
			_processOneSearchPage(theTab, function(piece2) {
				// create the complete book here
				if(piece2){
					// only if the book should be counted -- it could have been discounted if, e.g., no price was lited.
					finalResult.push(new AmazonBook(catName, currentPiece1Book, piece2));
				}
				// if there are books to process, do the recursion
				if(piece1BookArr.length) {
					currentPiece1Book = piece1BookArr.shift();
					theTab.url = currentPiece1Book.url;
				} else {
					cbThatGetFinalResult(finalResult);
					theTab.close();
				}
			});
			console.log("FIRE READY FOR a book detail ", _counter++, " URL: ", theTab.url);
		}
	});
}

function _processOneSearchPage(tab, cb) {
	console.log("ATTACHING a worker TO the BOOK DETAIL page...");
	var _fuckYouAmazonReload = true;
	var worker = tab.attach({
		contentScript : AmazonBookPiece2.toSource() + ";",
		contentScriptFile : [selfExt.data.url("jquery-2.1.3.min.js"), selfExt.data.url("am.parse.book.page.js")],
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
		if(data){
			console.log("BOOK received. ");
		}
		worker.destroy();
		return cb(data);
	});
	worker.port.on("captcha", function(){
		_fuckYouAmazonReload = false;
		// TODO finish -- wait for a button click and reload the tab
		// TODO wait, let's see if Amazon reloads the page automatically after I enter the captcha
		console.log("captcha signal received");
	});
	tmr.setTimeout(function(){
		console.log("ATTENTION RELOAD: _fuckYouAmazonReload outside: ", _fuckYouAmazonReload);
		if(_fuckYouAmazonReload){
			console.log("ATTENTION RELOAD: _fuckYouAmazonReload: ", _fuckYouAmazonReload);
			worker.destroy();
			getMostRecentBrowserWindow().gBrowser.selectedBrowser.reload();
		}
	}, settings.reloadTime);
}

module.exports = {
	processAllCats : processAllCats
};
