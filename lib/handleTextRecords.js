"use strict";
var sprintf = require("sprintf.js").sprintf;
var io = require("sdk/io/file");
var App = require("./App.js").App;

// no need for a callback <-- resource/time consumption is miniscule compared
// against network
function saveACategory(baseFolder, catObj, appArr, supposedLength) {
	var fname = sprintf("%s_%s_%i_%i_.txt", catObj.cat, (catObj.isTop ? "top" : "reg"), supposedLength, appArr.length);
	var fullFname = io.join(baseFolder, fname);
	var header = App.getHeader() + "\n";
	var body = "";
	appArr.forEach(function(el, i, arr){
		body += el.toString() + "\n";
	});
	return _writeTextToFile(header + body, fullFname);
}

function _writeTextToFile(text, filename) {
	var _test = {
		ifOk : false
	};
	var TextWriter = io.open(filename, "w");
	if(!TextWriter.closed) {
		TextWriter.write(text);
		TextWriter.close();
		_test.ifOk = true;
	}
	return _test;
}

function init(settings) {
	return {
		saveACategory : function(catObj, appArr) {
			return saveACategory(settings.baseFolder, catObj, appArr, settings.appsToSelectPerCategory);
		}
	};
}

module.exports = {
	init : init
};
