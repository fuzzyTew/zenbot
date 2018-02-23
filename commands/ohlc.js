var tb = require('timebucket')
  , n = require('numbro')
  , parallel = require('run-parallel')
  , crypto = require('crypto')

module.exports = function container (get, set, clear) {
  var c = get('conf') || {}

  var collectionService = get('lib.collection-service')(get, set, clear)

  return function (program) {
    program
      .command('ohlc')
      .description('download ohlc coinmarketcap data')
      .action(function (cmd) {
        var exchange = get('exchanges.coinmarketcap')
        if (!exchange) {
          console.error('cannot fill: exchange not implemented')
          process.exit(1)
        }

        if (!exchange.getOHLC) {
          console.error('cannot fill: exchange does not offer ohlc data')
          process.exit(0)
        }

        var ohlc = collectionService.getOHLC()

        var total = 0
        var completed = 0

        console.log('Enumerating products for ' + exchange.name)

        exchange.getProducts().forEach(function (p) {
          ++ total

          const selector = get('lib.objectify-selector')(exchange.name + '.' + p.asset + '-' + p.currency)

          ohlc.select({query: {selector: selector.normalized}, limit: 1, sort: {from: -1}}, function (err, prev_days) {
            if (err) {
              console.error('err filling selector: ' + selector.normalized);
              console.error(err)
              console.error('aborting!')
              process.exit(1)
            }

            var opts = {
              product_id: selector.product_id
            }
            if (prev_days[0]) {
              opts.from = prev_days[0].from
              console.log('Filling OHLCV for ' + selector.normalized + ' starting at ' + new Date(opts.from))
            } else {
              console.log('Filling OHLCV for ' + selector.normalized + ' for all time')
            }

            exchange.getOHLC(opts, function(err, days) {
              if (err) {
                console.error('err filling selector: ' + selector.normalized);
                console.error(err)
                console.error('aborting!')
                process.exit(1)
              }
  
              days.forEach(function (day) {
                day.id = selector.normalized + '-' + day.from
                day.selector = selector.normalized
                ++ total
                ohlc.save(day, daySaved)
              })
              ++ completed
            })
          })
        })

        function daySaved() {
          ++ completed
          if (completed >= total) process.exit(0)
        }
      })
  }
}
