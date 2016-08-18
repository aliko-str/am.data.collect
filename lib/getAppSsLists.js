"use strict";
var objUtil = require("sdk/util/object");
var tabs = require("sdk/tabs");
var selfExt = require("sdk/self");
var App = require("./App.js").App;

// appArr: an array of App.js
// callback: function, takes a cleaned array of App.js as an input
function populateAppSsLists(appArr, settings, callback, storage){
	var anApp = appArr.shift();
	if(!anApp){
		callback(storage);
	}else{
		tabs.open({
			url: anApp.url,
			onReady: function(tab){
				var worker = tab.attach({
					contentScriptFile : [selfExt.data.url("jquery-2.1.3.min.js"), selfExt.data.url("sprintf.js"), selfExt.data.url("client.main.appPage.js")],
					contentScript: "window.App = " + App.toSource() + ";",
					attachTo : "top"
				});
				worker.port.emit("settings", objUtil.merge({}, settings, {debug: true}));
				worker.port.on("msg", function(msg) {
					return console.log(msg);
				});
				worker.port.on("done", function(appInfoObj) {
					if(appInfoObj){
						storage.push(anApp.extend(appInfoObj));
					}
					tab.close();
					return populateAppSsLists(appArr, settings, callback, storage);
				});
				return;
			}
		});
	}
	return;
}


module.exports = {
	populateAppSsLists: function(appArr, settings, callback){
		var storage = [];
		populateAppSsLists(appArr, settings, callback, storage);
	}
};
