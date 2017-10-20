var sc = require('./script')

// let Web3 = require('web3')
// var provider = new Web3.providers.HttpProvider("http://52.210.215.150:8545")

// let contract = require('truffle-contract')
// let Presale = contract(require('../build/contracts/Presale.json'))
// Presale.setProvider(provider);
module.exports = async function(callback) {
    await sc.initialize();
    var a = await sc.presaleContract.etherEscrowAddress()
    console.log("PRESALE VALUE:", a);

}