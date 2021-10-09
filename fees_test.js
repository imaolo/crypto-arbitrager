const ccxt = require('ccxt');
var phemex = new ccxt.phemex();
var bybit  = new ccxt.bybit();

(async function() {
    //initialization
    await phemex.loadMarkets()
    console.log(phemex.fees)
})()



/*

bybit: 
{
  trading: {
    tierBased: false,
    percentage: true,
    taker: 0.00075,
    maker: -0.00025
  },
  funding: { tierBased: false, percentage: false, withdraw: {}, deposit: {} }
}


phemex:
{
  trading: { tierBased: false, percentage: true, taker: 0.001, maker: 0.001 },
  funding: {
    tierBased: undefined,
    percentage: undefined,
    withdraw: {},
    deposit: {}
  }
}
*/
