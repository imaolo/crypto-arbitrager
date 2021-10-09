'use strict'
const {MongoClient} = require("mongodb");
const ccxt = require('ccxt');

//global constants
const URI  = "mongodb://localhost:27017";

//global variables
var db_client = new MongoClient(URI);
var phemex = new ccxt.phemex();
var bybit  = new ccxt.bybit();
var tickers = {};
var tickCount = 0;

//main
(async function() {
    //initialization
    await establishDBConnection()
    await loadMarkets()
    findCommonMarkets()

    setInterval(tick,5000)
})()

async function tick(){
    console.log(`tick - ${++tickCount}`)
    try{
        await retrieveTickers()
        await DBRecordTickers()  
    } catch(err){
        console.log("\ntick() error\n")
        console.error(err)
    }
    if (tickCount % 10000 == 0){
        //reinitialize exchange objects
        console.log("Reinitializing")
        phemex = new ccxt.phemex();
        bybit  = new ccxt.bybit();
        await loadMarkets()
        findCommonMarkets()
    }
}

//places tickers data into the database
async function DBRecordTickers(){
    try{
        let tickers_coll = db_client.collection("tickers")
        await tickers_coll.insertOne({datetime: new Date(), data:tickers})
    } catch (err){
        console.log("\nDBRecordTickers() error\n")
        console.error(err)
        await DBReportError(err)
    }
}

//overwrites tickers object with new ticker data
async function retrieveTickers(){
    try{
        let phemexPromise = Object.keys(tickers).map(market => phemex.fetchTicker(market+"/USD"))
        let bybitData = await bybit.fetchTickers(Object.keys(tickers).map(market => market+"/USDT"))
        var phemexData = await Promise.all(phemexPromise)
        //could probably do these in one loop
        for (let [market,value] of Object.entries(bybitData)){
            let tickerSymbol = value.symbol.split("/")[0]
            tickers[tickerSymbol].bybit = value 
        }
        for (let market of phemexData){
            let tickerSymbol = market.symbol.split("/")[0]
            tickers[tickerSymbol].phemex = market 
        }
    } catch(err){
        console.log("\nretrieveTickers() error\n")
        console.error(err)
        await DBReportError(err)  
    }
}

//pings the database for connectivity and redefines db_client to point to crypto_app database
async function establishDBConnection()
{
    try {
        console.log("Connecting to database...")
        await db_client.connect();
        await db_client.db("admin").command({ ping: 1 });
        db_client = db_client.db("crypto_app")
        console.log("Connected to database")
    } catch (err) {
        console.log("\nestablishDBConnection() error\n")
        console.error(err)
        terminateProgram()
    }
}

//loads the markets into the exchange objects, must be called before findCommonMarkets can be called
async function loadMarkets()
{
    console.log("Loading markets...")
    try{
        await phemex.loadMarkets()
    } catch (err){
        console.log("\nloadMarkets() error: Error loading phemex markets\n")
        console.error(err)
        terminateProgram()
    }
    try{
        await bybit.loadMarkets()
    } catch (err){
        console.log("\nloadMarkets() error: Error loading bybit markets\n")
        console.error(err)
        terminateProgram()
    }
    console.log("Loaded markets")
}

//inserts the parameter into the errors collection
async function DBReportError(err){
    let errors_coll = await db_client.collection("errors")
    let error_doc = {
        datetime: new Date(),
        error: err
    }
    await errors_coll.insertOne(error_doc)
}

//populates the tickers object with the markets that will be monitored
function findCommonMarkets(){
    //bybit quoted in usdt
    let bybit_leverage_markets = Object.keys(bybit.markets).filter((market) => {
        return bybit.markets[market].linear == true
    })
    bybit_leverage_markets = bybit_leverage_markets.map(market => market.split('/')[0])

    //phemex quoted in usd
    let phemex_leverage_markets = Object.keys(phemex.markets).filter((market) => {
        let value = phemex.markets[market]
        return value.info.settleCurrency == "USD" &&  value.type == "perpetual" && value.info.quoteCurrency == "USD" 
    })
    phemex_leverage_markets = phemex_leverage_markets.map(market => market.split('/')[0])

    phemex_leverage_markets.filter(market => {
        return bybit_leverage_markets.includes(market)
    }).forEach(market => {
        tickers[market] = {
            bybit :{},
            phemex: {}
        }   
    })
}

//informs the user the program will be terminated, then ends the program
function terminateProgram(){
    console.log("\n\nProgram terminated\n\n")
    process.exit()
}

    //trading strategy
    // open position
    //     if (def > threshold)
    //         purchase more
    //     else if (dif == 0 )
    //         close position, realize gains
    //     else
    //         nothing
    // no position
    //     if (dif > threshold)
    //         open position
    //     else
    //         nothing
    // */



    // const phemexAuth = {
    //     apiKey: "",
    //     secret: ""
    // };
    // const bybitAuth  = {
    //     apiKey: "",
    //     secret: ""
    // };