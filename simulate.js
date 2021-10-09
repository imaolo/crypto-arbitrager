'use strict'
const {MongoClient} = require("mongodb");
//global constants
const URI  = "mongodb://localhost:27017";

//global variables
var db_client = new MongoClient(URI);


//informs the user the program will be terminated, then ends the program
function terminateProgram(){
    console.log("\n\nProgram terminated\n\n")
    process.exit()
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

(async function() {
    await establishDBConnection()

    //retrieve tickers simulations
    let tickers = await db_client.collection("tickers").find().sort({datetime:1})

    tickers.forEach(ticker => {
        tick(ticker)
    })
})()

async function tick(){
    console.log
}


