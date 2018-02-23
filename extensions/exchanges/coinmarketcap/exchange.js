const request = require('request');
const xmldom = require('xmldom');
const xpath = require('xpath');

module.exports = function container (get, set, clear) {

  function toYMD (date) {
    return date.getUTCFullYear() + ('0' + (date.getUTCMonth() + 1)).slice(-2) + ('0' + date.getUTCDate()).slice(-2)
  }
  
  var exchange = {
    name: 'coinmarketcap',

    getProducts: function () {
      return require('./products.json')
    },

    getOHLC: function (opts, cb) {
      var symbol = opts.product_id.split('-')[0]
      var id
      require('./products.json').forEach(function (product) {
        if (product.asset == symbol)
          id = product.label.split('/')[0]
      })
      var from, to
      if (opts.from)
        from = new Date(opts.from)
      else
        from = new Date(Date.UTC(2013,4,28))
      if (opts.to)
        to = new Date(opts.to)
      else
        to = new Date()

      request('https://coinmarketcap.com/currencies/' + id + '/historical-data/?start=' + toYMD(from) + '&end=' + toYMD(to), function(error, response, body) {
        if (error)
          return cb(error)

        const doc = new xmldom.DOMParser({errorHandler:{}}).parseFromString(body)
        const rows = xpath.select('//tr', doc)
        const header = rows.shift()
        var data = []
        rows.forEach(function (row) {
          const cells = xpath.select('./td', row)
          const from = Date.parse(cells[0].firstChild.data + ' GMT')
          data.push({
            from: from,
            to: from + 86400000,
            open: Number(cells[1].firstChild.data),
            high: Number(cells[2].firstChild.data),
            low: Number(cells[3].firstChild.data),
            close: Number(cells[4].firstChild.data),
            volume: Number(cells[5].firstChild.data.replace(/,/g,''))
          })
        })
        cb(null, data)
      })
    }
  }
  return exchange
}
