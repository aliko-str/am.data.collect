const objUtil = require("sdk/util/object");
const io = require("sdk/io/file");
const Request = require("sdk/request").Request;
const _settings = require("./settings.js");
const _s = _settings;

function getCommentFolders(catArr){
	const catToFolderObj = {};
	catArr.forEach(function(catName) {
		catToFolderObj[catName] = io.join(_s.baseFolder, catName + "_comments");
		io.mkpath(catToFolderObj[catName]);
	});
	return catToFolderObj;	
}

function createCatFolders(baseFolder, catArr) {
	const catToFolderObj = {};
	catArr.forEach(function(catName) {
		// catName = catName.replace(/[^\w\d]/g, "_");
		catToFolderObj[catName] = io.join(baseFolder, catName);
		io.mkpath(catToFolderObj[catName]);
	});
	return catToFolderObj;
}
function reqAndSaveAllPngs(allBooksObj, cb) {
	const catToFolderObj = createCatFolders(_s.baseFolder, Object.keys(allBooksObj));
	doOneCatRecurs(allBooksObj, 0, catToFolderObj, {}, cb);
}
function doOneCatRecurs(allBooksObj, _catCounter, catToFolderObj, reportObj, cbAllDone) {
	const catArr = Object.keys(allBooksObj);
	if(_catCounter < catArr.length) {
		if(_s.debug) {
			console.log("About to start saving PNGs for the category: ", catArr[_catCounter]);
		}
		const fNameImUrlPairs = allBooksObj[catArr[_catCounter]].filter(function(aBook){
			if(!aBook.icoUrl){
				console.log("NO ICON URL to retrieve -- skippin it...");
			}
			return aBook.icoUrl;
		}).map(function(aBook) {
			var fext = aBook.icoUrl.split(".");
			fext = fext[fext.length-1];
			return {
				url : aBook.icoUrl,
				fname : aBook.id + "." + fext
			};
		});
		_saveArrOfImg(catToFolderObj[catArr[_catCounter]], fNameImUrlPairs, function(report) {
			// one category images are saved -- move on to the next;
			reportObj[catArr[_catCounter]] = report;
			if(_s.debug) {
				console.log("Category: ", catArr[_catCounter]);
				console.log("REPORT: ", report);
			}
			doOneCatRecurs(allBooksObj, _catCounter + 1, catToFolderObj, reportObj, cbAllDone);
			return;
		});
	} else {
		const reportAsText = Object.keys(reportObj).map(function(el) {
			return "Category: " + el + " -- result: " + reportObj[el];
		}).join("\n");
		writeDataToFile(reportAsText, io.join(_s.baseFolder, "report.images.txt"), "w");
		cbAllDone(reportObj);
	}
	return;
}
function _saveArrOfImg(folder, fNameImUrlPairs, callback) {
	var semaphore = fNameImUrlPairs.length;
	var _successCounter = 0;
	for(var aPair of fNameImUrlPairs) {
		var aReq = Request({
			url : aPair.url,
			overrideMimeType : "text/xml; charset=x-user-defined",
			onComplete : (function(aPair, retryCounter) {
				return function(resp) {
					--semaphore;
					if(resp.status >= 300 || resp.status < 200) {
						console.error("#nUpBT AMAZON was rude to us... Status:" + resp.status + " StatusText: " + resp.statusText + " The Request Url: " + aPair.url);
						console.log("NO image is going to be saved for: ", aPair.fname);
						// if(++retryCounter < 2) {
							// return aReq.get();
						// }
					} else {
						if(_settings.debug) {
							console.log("A response received for an img: ", aPair.fname);
						}
						if(writeDataToFile(resp.text, io.join(folder, aPair.fname), "wb")) {
							_successCounter++;
						}
					}
					if(!semaphore) {
						if(_settings.debug) {
							console.log("TIME TO CALL THE CALLBAK since 'sempahore' == 0 for the _saveArrOfImg");
						}
						const report = "Successfully saved: " + _successCounter + " out of " + fNameImUrlPairs.length;
						callback(report);
					}
					if(_settings.debug) {
						console.log("_saveArrOfImg Semaphore VALUE: ", semaphore);
					}
				};
			})(aPair, 0)
		});
		aReq.get();
	}
}
function writeDataToFile(text, filename, mode) {
	mode = mode || "w";
	var _test = {
		ifOk : false
	};
	var TextWriter = io.open(filename, mode);
	if(!TextWriter.closed) {
		TextWriter.write(text);
		TextWriter.close();
		_test.ifOk = true;
	}
	return _test;
}
function saveBookArrInTabTables(allResObj, header) {
	var _okCount = 0;
	Object.keys(allResObj).forEach(function(cat) {
		const bookArr = allResObj[cat];
		if(saveBooksForOneCatInTabTables(cat, bookArr, header).ifOk) {
			_okCount++;
		};
	});
	return _okCount;
}
function saveBooksForOneCatInTabTables(catName, bookArr, header) {
	const bookArrAsStr = header + "\n" + bookArr.map(function(book) {
		return book.toTabString();
	}).join("\n");
	return writeDataToFile(bookArrAsStr, io.join(_s.baseFolder, catName + ".txt"), "w");
}

function readTabTable(fName){
	const tabTableStr = io.read(fName, "rt");
	const tabTableArr = tabTableStr.split("\n");
	const legend = tabTableArr[0].split("\t");
	var tabTable = [];
	for(var i = 1; i < tabTableArr.length; i++){
		var allProps = tabTableArr.split("\t");
		var anObj = {};
		for(var iprop = 0; iprop < legend.length; iprop++){
			anObj[legend[iprop]] = allProps[iprop];
		}
		tabTable.push(anObj);
	}
	return anObj;
}

function arrToTabTable(arrOfObj){
	const props = Object.keys(arrOfObj[0]);
	const legend = props.join("\t");
	const allObjAsStr = arrOfObj.map(function(el){
		return props.map(function(aPropName){
			return el[aPropName];
		}).join("\t");
	});
	return legend + "\n" + allObjAsStr.join("\n");
}

module.exports = {
	reqAndSaveAllPngs : reqAndSaveAllPngs,
	writeDataToFile : writeDataToFile,
	saveBookArrInTabTables : saveBookArrInTabTables,
	saveBooksForOneCatInTabTables : saveBooksForOneCatInTabTables,
	getCommentFolders: getCommentFolders,
	readTabTable: readTabTable,
	arrToTabTable: arrToTabTable,
	mkFolder: function(path){
		return io.mkpath(path);
	}
}; 