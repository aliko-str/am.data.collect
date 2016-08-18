var objUtil = require("sdk/util/object");
var io = require("sdk/io/file");
var Request = require("sdk/request").Request;
var _settings = {
	debug : false
};

function saveAppArrIcons(baseFolder, appArr, callback) {
	var syncRootTop = false, syncRootReg = false;
	if(_settings.debug)
		console.log("Saving icons of apps, num: ", appArr.length);
	var topApps = [];
	var regularApps = [];
	for(var i = 0, ilen = appArr.length; i < ilen; i++) {
		var anApp = appArr[i];
		var pair = {
			fname : anApp.icoName,
			url : anApp.iconUrl
		};
		if(anApp.isTop) {
			topApps.push(pair);
		} else {
			regularApps.push(pair);
		}
	}
	if(topApps.length) {
		syncRootTop = true;
		_saveArrOfImg(io.join(baseFolder, "top", "icons"), topApps, function() {
			syncRootTop = false;
			if(!syncRootReg) {
				callback();
			}
		});
	}
	if(regularApps.length) {
		syncRootReg = true;
		_saveArrOfImg(io.join(baseFolder, "regular", "icons"), regularApps, function() {
			syncRootReg = false;
			if(!syncRootTop) {
				callback();
			}
		});
	}
	return {
		_test : {
			_topAppArrLength : topApps.length,
			_regularAppArrLength : regularApps.length
		}
	};
}

function saveSSofAnApp(baseFolder, category, anApp, callback) {
	if(_settings.debug)
		console.log("Saving screenshots of an app, ", anApp.name, " numOfSs: ", anApp.ssUrls.length);
	var fNameImUrlPairs = [];
	for(var idx = 0, ilen = anApp.ssUrls.length; idx < ilen; idx++) {
		fNameImUrlPairs.push({
			fname : anApp.name + "_" + idx + ".png",
			url : anApp.ssUrls[idx]
		});
	}
	var folderCatAndApp = io.join(baseFolder, (anApp.isTop ? "top" : "regular"), category, anApp.name);
	io.mkpath(folderCatAndApp);
	_saveArrOfImg(folderCatAndApp, fNameImUrlPairs, callback);
	return {
		_test : {
			_numOfSS : fNameImUrlPairs
		}
	};
}

function _saveArrOfImg(folder, fNameImUrlPairs, callback) {
	var semaphore = fNameImUrlPairs.length;
	for(var idx in fNameImUrlPairs) {
		var aPair = fNameImUrlPairs[idx];
		var aReq = Request({
			url : aPair.url,
			overrideMimeType : "text/xml; charset=x-user-defined",
			onComplete : (function(aPair, retryCounter) {
				return function(resp) {
					if(resp.status >= 300 || resp.status < 200) {
						console.error("#nUpBT GPlay was rude to us... Status:" + resp.status + " StatusText: " + resp.statusText + " The Request Url: " + aPair.url);
						if(++retryCounter < 2) {
							return aReq.get();
						}
					} else {
						if(_settings.debug) {
							console.log("A response received for an img: ", aPair.fname);
						}
						_writeImgToFile(resp.text, io.join(folder, aPair.fname));
					}
					if(!(--semaphore)) {
						if(_settings.debug) {
							console.log("TIME TO CALL THE CALLBAK since 'sempahore' == 0 for the _saveArrOfImg");
						}
						callback();
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

function _writeImgToFile(text, filename) {
	var _test = {
		ifOk : false
	};
	var TextWriter = io.open(filename, "wb");
	if(!TextWriter.closed) {
		TextWriter.write(text);
		TextWriter.close();
		_test.ifOk = true;
	}
	return _test;
}

function init(settings, categoryList) {
	var baseFolder = settings.baseFolder;
	_settings = objUtil.merge(settings, _settings);
	if(!io.exists(baseFolder)) {
		io.mkpath(baseFolder);
	}
	io.mkpath(io.join(baseFolder, "top"));
	io.mkpath(io.join(baseFolder, "regular"));
	io.mkpath(io.join(baseFolder, "top", "icons"));
	io.mkpath(io.join(baseFolder, "regular", "icons"));
	for(var i in categoryList) {
		io.mkpath(io.join(baseFolder, "top", categoryList[i]));
		io.mkpath(io.join(baseFolder, "regular", categoryList[i]));
	}
	return {
		saveAppArrIcons : function(appArr, callback) {
			return saveAppArrIcons(baseFolder, appArr, callback);
		},
		saveSSofAnApp : function(catName, anApp, callback) {
			return saveSSofAnApp(baseFolder, catName, anApp, callback);
		},
		saveSSofAllApps : function(catName, appArr, callback) {
			var semaphore = appArr.length;
			for(var idx in appArr) {
				this.saveSSofAnApp(catName, appArr[idx], (function(idx) {
					return function() {
						if(_settings.debug) {
							console.log("Curr. semahore value: ", semaphore - 1);
						}
						if(!(--semaphore)) {
							if(_settings.debug) {
								console.log("All SS of all apps have been saved!");
							}
							return callback();
						}
					};
				})(idx));
			}
			return;
		}
	};
}

module.exports = {
	init : init
};
