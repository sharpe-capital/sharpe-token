var sc = require('./script')
//var abi = require('ethereumjs-abi')



// let Web3 = require('web3')
// var provider = new Web3.providers.HttpProvider("http://52.210.215.150:8545")

// let contract = require('truffle-contract')
// let Presale = contract(require('../build/contracts/Presale.json'))
// Presale.setProvider(provider);
module.exports = async function(callback) {
    await sc.initialize();

    // var a = await sc.preSaleContract.whitelist.call("0xBd52e10fa8838E6CecF16d279f700eB218aBE199");
    // console.log("Whitelists",  a);


    // var paused = await sc.generalSaleContract.closed();
    // console.log("closed: ",  paused);

    // var tokenFactoryAddress =  await sc.shpContract.tokenFactory();
    // console.log("TF: ", tokenFactoryAddress);
    // var parameterTypes = ["address"];
    // var parameterValues = [tokenFactoryAddress];
    // var encoded = abi.rawEncode(parameterTypes, parameterValues);
    // console.log(encoded.toString('hex'));
    //console.log("PRESALE PAUSED:", );

    let preSaleFounderTokenCount = await sc.preSaleContract.founderTokenCount();
    console.log("PRESALE: ", "FOUNDER", preSaleFounderTokenCount);
    let preSaleReserveTokenCount = await sc.preSaleContract.reserveTokenCount();
    console.log("PRESALE: ", "RESERVE", preSaleReserveTokenCount);

    
    let generalSaleFounderTokenCount = await sc.generalSaleContract.founderTokenCount();
    console.log("GENERAL SALE: ", "FOUNDER", generalSaleFounderTokenCount);
    let generalSaleReserveTokenCount = await sc.generalSaleContract.reserveTokenCount();
    console.log("GENERAL SALE: ", "RESERVE", generalSaleReserveTokenCount);

    let founderTokenCount = preSaleFounderTokenCount.toNumber() + generalSaleFounderTokenCount.toNumber();
    let reserveTokenCount = preSaleReserveTokenCount.toNumber() + generalSaleReserveTokenCount.toNumber();
    
    console.log("TOTAL TOKEN COUNT - FOUNDER: ", founderTokenCount, "  -  RESERVE: ", reserveTokenCount);
}