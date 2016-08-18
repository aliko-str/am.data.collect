var _debug = true;
var gSettings;
var syncRoot = {};

(function run() {
	self.port.emit("hello", "HI from the client script. URL: " + window.location.href);
	self.port.on("settings", function(settings) {
		_debug = settings.debug;
		gSettings = settings;
		if(_debug) {
			console.log("A 'settings' object received. Starting extraction.");
		}
		return waitTillInitialAppsLoad(function() {
			fetchAdditionalApps(function(appArr) {
				return self.port.emit("done", appArr);
			});
		});
	});

})();

function doTheExtraction(jqAppDivs) {
	var appArr = [];
	jqAppDivs.each(function(i, el) {
		var jqEl = window.$(el);
		var appPageUrl = jqEl.find("a.card-click-target")[0].href;
		var iconUrl = jqEl.find("img.cover-image").attr("src");
		var rank = -1;
		var jqTitle = jqEl.find("h2 a.title");
		if(gSettings.isTop) {
			rank = jqTitle.text().replace(/\.[\w\W]*$/, "").replace(/\s*/g, "");
		}
		var appName = jqTitle.text().replace(/^\s*\d*\./, "").replace(/\s*/g, "");
		appArr.push(new App(appName, appPageUrl, gSettings.isTop, rank, iconUrl));
	});
	return appArr;
}

function waitTillInitialAppsLoad(nextStepF) {
	var loadDivVisible = $("div.body-content-loading-overlay")[0].style.display;
	if(loadDivVisible != "none") {
		window.setTimeout(function() {
			if(_debug) {
				console.log("The initial app list hasn't been loaded yet -- waiting a second.");
			}
			waitTillInitialAppsLoad(nextStepF);
		}, 1000);
	} else {
		nextStepF();
	}
}

function fetchAdditionalApps(callback) {
	var jqAppDivs = window.$("div.card-list > div.card");
	if(!jqAppDivs.length) {
		// wait
		if(_debug)
			console.log("The body of page hasn't loaded yet -- waiting for a second");
		window.setTimeout(function() {
			fetchAdditionalApps(callback);
		}, 1000);
	} else if(jqAppDivs.length < gSettings.appsToSelectPerCategory) {
		if(_debug)
			console.log("the current num of app:" + jqAppDivs.length);
		if(window.scrollMaxY > window.scrollY) {
			if(_debug)
				console.log("Not enough apps on the page -- scroll down and ask for more");
			window.scroll(0, window.scrollMaxY);
			// wait
			return window.setTimeout(function() {
				fetchAdditionalApps(callback);
			}, 1000);
		}
		var showMoreShown = window.$("div.bottom-loading")[0].style.display;
		if(_debug)
			console.log("Loader display is: " + showMoreShown);
		if(showMoreShown == "none") {
			var jqShowMoreButton = window.$("#show-more-button");
			if(jqShowMoreButton[0].style.display == "none") {
				//wait for it for a little while
				if(!syncRoot.showMoreButtonCounter) {
					syncRoot.showMoreButtonCounter = 1;
				}
				if(++syncRoot.showMoreButtonCounter < (gSettings.appsToSelectPerCategory) / 13) {
					window.scroll(0, 0);
					if(_debug)
						console.log("WAITING for a showMoreButton to appear.");
					window.setTimeout(function() {
						fetchAdditionalApps(callback);
					}, 1000);
				} else {
					// if we can't get more apps -->  do the extraction
					callback(doTheExtraction(jqAppDivs));
				}
			} else {
				// click the button and wait for more
				jqShowMoreButton.click();
				if(_debug)
					console.log("The showMore button is clicked, waiting for more...");
				window.setTimeout(function() {
					fetchAdditionalApps(callback);
				}, 1000);
			}
		} else {
			// wait
			window.setTimeout(function() {
				fetchAdditionalApps(callback);
			}, 1000);
		}
	} else {
		// do the extraction
		callback(doTheExtraction(jqAppDivs));
	}
	return;
}
