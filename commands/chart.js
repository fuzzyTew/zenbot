var cligraph = require('cli-graph')
  , windowsize = require('window-size')

module.exports = function container (get, set, clear) {
  var c = get('conf') || {}

  var collectionService = get('lib.collection-service')(get, set, clear)

  return function (program) {
    program
      .command('chart [selector]')
      .description('chart price')
      .option('-f, --from <date>', 'start time')
      .option('-t, --to <date>', 'end time')
      .action(function (selector, cmd) {
        selector = get('lib.objectify-selector')(selector || c.selector)
        var exchange = get('exchanges.' + selector.exchange_id)
        if (!exchange) {
          console.error('cannot chart: exchange not implemented')
          process.exit(1)
        }

        var ohlc = collectionService.getOHLC()

        var query = {
          query : {
            selector: selector.normalized
          },
          sort: {
            from: 1
          }
        }

        if (cmd.to)
          query.query.from = { $lt: Date.parse(cmd.to) }
        if (cmd.from)
          query.query.to = { $gt: Date.parse(cmd.from) }

        ohlc.select(query, function (err, ohlcs) {

          if (err) {
            console.log(err)
            process.exit(-1)
          }

          const height = windowsize.height - 2
          const width = windowsize.width
          const start = ohlcs[0].from
          const end = ohlcs[ohlcs.length - 1].to
          var bucketSums = []
          var bucketVolumes = []
          var min = 1/0
          var max = -1/0

          ohlcs.forEach(function (ohlc) {
            const bucket = Math.floor(((ohlc.from + ohlc.to) / 2 - start) * (width + 1) / (end - start))
            if (! bucketSums[bucket]) {
              bucketSums[bucket] = 0
              bucketVolumes[bucket] = 0
            }
            if (ohlc.high > max)
              max = ohlc.high
            if (ohlc.low < min)
              min = ohlc.low
            var volume = 1
            if (ohlc.volume)
              volume = ohlc.volume
            bucketVolumes[bucket] += volume
            bucketSums[bucket] += (ohlc.open + ohlc.close) / 2 * volume
          })

          const graph = new cligraph({
            height: height,
            width: width,
            aRatio: 1,
            center: {x: 0, y: height - 1}
          }).setFunctionX(function (x) {
            console.log(x + ': ' + bucketSums[x])
            return ((bucketSums[x] / bucketVolumes[x]) - min) * height / (max - min)
          })
          console.log(graph.toString() + selector.normalized + ' ' + new Date(start).toISOString() + ' - ' + new Date(end).toISOString())
          process.exit(0)
        })
      })
  }
}
