module.exports = {
  _ns: 'zenbot',

  'exchanges.coinmarketcap': require('./exchange'),
  'exchanges.list[]': '#exchanges.coinmarketcap'
}
