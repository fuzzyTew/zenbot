#!/usr/bin/env node

var CoinMarketCap = require('node-coinmarketcap');

var convert = 'USD'

new CoinMarketCap({convert: convert}).getAll(function (coinObjs) {
  var products = []
  coinObjs.forEach(function (coinObj) {
    products.push({
      asset: coinObj.symbol,
      currency: convert,
      label: coinObj.id + '/' + convert
    })
  })
  var target = require('path').resolve(__dirname, 'products.json')
  require('fs').writeFileSync(target, JSON.stringify(products, null, 2))
  console.log('wrote', target)
  process.exit()

})
