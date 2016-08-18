var objUtil = require("sdk/util/object");
var selfExt = require("sdk/self");
var tabs = require("sdk/tabs");
var timer = require("sdk/timers");
var App = require("./App.js").App;

function openOneByOneAndExtract(gPlayAppArr, settings, callback, storage) {
	var currCatObj = gPlayAppArr.shift();
	if(currCatObj) {
		tabs.open({
			url : currCatObj.url,
			onReady : function(tab) {
				var worker = tab.attach({
					contentScriptFile : [selfExt.data.url("jquery-2.1.3.min.js"), selfExt.data.url("client.main.js")],
					contentScript: "window.App = " + App.toSource() + ";",
					attachTo : "top"
				});
				worker.port.on("hello", function(msg) {
					console.log(msg);
					return;
				});
				worker.port.on("done", function(data) {
					console.log("DATA LENGTH: ", data.length);
					// if in the debug more, cut excessive apps from processing any further
					// if(settings.debug || true){
						// console.log("TODO remove after testing");
						// data = data.slice(0, settings.appsToSelectPerCategory);
					// }
					// client-size App instances don't have methods --> restoration of 'true' Apps:
					data = data.map(function(el, i, arr){
						return App.restore(el);
					});
					storage.push({catObj: currCatObj, appArr: data});
					tab.close();
					openOneByOneAndExtract(gPlayAppArr, settings, callback, storage);
					return;
				});
				var setObj = objUtil.merge({isTop: currCatObj.isTop}, settings, {debug: false});
				worker.port.emit("settings", setObj);
			}
		});
	} else {
		callback(storage);
	}
	return;
}

module.exports = {
	gatherCatInfo : function(gPlayAppArr, settings, callback){
		var storage = [];
		return openOneByOneAndExtract(gPlayAppArr, settings, callback, storage);
	}
};
