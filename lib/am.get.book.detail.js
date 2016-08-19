const io = require("sdk/io/file");
const AmazonBookPiece2 = require("./am.urls.js").AmazonBookPiece2;
const AmazonBook = require("./am.urls.js").AmazonBook;
const selfExt = require("sdk/self");
const tabs = require("sdk/tabs");
const amReqAndSave = require("./am.req.and.save.data.js");
// const _s = require("./settings.js");

function _getATab(cb) {
	return tabs.open({
		url : "https://www.google.it/",
		onOpen : cb
	});
}

function processAllCats(piece1BookArrObj, cbAllDone){
	const catNames = Object.keys(piece1BookArrObj);
	const resultObj = {};
	const commentFolders = amReqAndSave.getCommentFolders(catNames);
	function __codeWrapper(currCat){
		_processACategory(currCat, piece1BookArrObj[currCat], function(bookArrOneCat){
			resultObj[currCat] = bookArrOneCat;
			// save the results -- I expect the addon to fall once in a while, so we better save the data we already have and restart later without the saved categories
			amReqAndSave.saveBooksForOneCatInTabTables(currCat, bookArrOneCat, AmazonBook.getHeader());
			// save all comment arrays for all Books in separate files
			bookArrOneCat.forEach(function(aBook){
				amReqAndSave.writeDataToFile(aBook.commArrToStr(), io.join(commentFolders[currCat], aBook.id + ".txt"));
			});
			// restart recursion if needed
			if(catNames.length){
				__codeWrapper(catNames.shift());
			}else{
				cbAllDone(resultObj);
			}
		});		
	}
	__codeWrapper(catNames.shift());
}

function _processACategory(catName, piece1BookArr, cbThatGetFinalResult) {
	if(!piece1BookArr.length){
		return console.error("piece1BookArr ARRAY IS EMPTY!");
	}
	var finalResult = [];
	var currentPiece1Book = piece1BookArr.shift();
	_getATab(function(theTab) {
		theTab.on("ready", function(tab) {
			// set-up worker attaching for each url
			_processOneSearchPage(tab, function(piece2) {
				// create the complete book here
				finalResult.push(new AmazonBook(catName, currentPiece1Book, piece2));
				// if there are books to process, do the recursion
				if(urlArr.length) {
					currentPiece1Book = piece1BookArr.shift();
					theTab.url = currentPiece1Book.url;
				} else {
					cbThatGetFinalResult(finalResult);
					theTab.close();
				}
			});
		});
		// start the recursive process
		theTab.url = currentPiece1Book.url;
	});
}

function _processOneSearchPage(tab, cb) {
	console.log("ATTACHING a worker TO the Listing page...");
	var worker = tab.attach({
		contentScriptFile : [selfExt.data.url("jquery-2.1.3.min.js"), selfExt.data.url("am.parse.book.page.js")],
		contentScript : "window.AmazonBookPiece2 = " + AmazonBookPiece2.toSource() + ";",
		attachTo : "top"
	});
	worker.port.on("hello", function(msg) {
		console.log(msg);
		return;
	});
	worker.port.on("data", function(data) {
		return cb(data);
	});
}

module.exports = {
	processAllCats : processAllCats
};
