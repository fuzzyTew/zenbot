module.exports = (function (get, set, clear) {

	return {

		getTrades: () => {
	        var trades = get('db.trades')
	        get('db.mongo').collection('trades').ensureIndex({selector: 1, time: 1})

	        return trades
		},	

		getOHLC: () => {
		var ohlc = get('db.ohlc')
		get('db.mongo').collection('ohlc').ensureIndex({selector: 1, from: 1})

		return ohlc
		},

		getResumeMarkers: () => {
	        var resume_markers = get('db.resume_markers')
	        get('db.mongo').collection('resume_markers').ensureIndex({selector: 1, to: -1})

	        return resume_markers;
		}
	}

})

