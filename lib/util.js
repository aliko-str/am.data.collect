function interpolate(s, o) {
	return s.replace(/<%([^<%>]*)%>/g, function(a, b) {
		var r = o[b];
		return typeof r === 'string' || typeof r === 'number' ? r : a;
	});
};


module.exports = {
	interpolate: interpolate
};
