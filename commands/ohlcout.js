var cligraph = require('cli-graph')
  , windowsize = require('window-size')

module.exports = function container (get, set, clear) {
  var c = get('conf') || {}

  var collectionService = get('lib.collection-service')(get, set, clear)

  return function (program) {
    program
      .command('ohlcout')
      .description('output ohlc data suitable for libICA')
      .option('-d, --days <days>', 'number of days of history to require', Number, 365*2)
      .action(function (cmd) {

        var start = new Date().getTime() - cmd.days * 86400000

        var selectors = []

        var ohlc = collectionService.getOHLC()

        // get selectors which start as early as requested
        ohlc.select({
          query: {
            from: { $gte: start, $lt: start + 86400000 }
          },
          sort: {
            from: 1
          }
        }, function (err, results) {
          if (err) { console.log(err); process.exit(-1); }
          var min = start + 86400000
          results.forEach(function (result) {
            if (result.from < min)
              min = result.from
          })
          start = min
          results.forEach(function (result) {
            if (result.from == min) {
              selectors.push(result.selector)
            }
          })

          // get data for each selector
          var data = {}
          var maxLen = 0
          var total = 0
          var completed = 0
          selectors.forEach(function (selector) {
            ++ total
            ohlc.select({
              query: {
                selector: selector,
                from: { $gte: start }
              },
              sort: {
                from: 1
              }
            }, function( err, results) {
              if (err) { console.log(err); process.exit(-1); }
              var resultArray = []
              results.forEach(function (result) {
                resultArray.push((result.open + result.close) / 2)
              })
              if (resultArray.length >= maxLen)
                maxLen = resultArray.length
              data[selector] = resultArray
              ++ completed
  
              if (completed == total) {
                // prune selectors that didn't have all the data
                selectors.forEach(function (selector) {
                  if (data[selector].length < maxLen)
                    delete data[selector]
                })
  
                // output !
                selectors = Object.keys(data)
                selectors.sort()
                console.log(maxLen, selectors.length)
                for (var i = 0; i < maxLen; ++ i) {
                  var line = null
                  selectors.forEach(function (selector) {
                    if (line) line += ' '
                    else line = ''
                    line += Math.log(data[selector][i])
                  })
                  console.log(line)
                }
                console.log(selectors.join(' '))
                process.exit(0)
              }
            })
          })
        })

      })
  }
}
