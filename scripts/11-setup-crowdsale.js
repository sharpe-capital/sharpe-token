let Web3 = require('web3');
var provider = new Web3.providers.HttpProvider("http://34.240.84.166:8545")
let contract = require('truffle-contract');
const web3 = new Web3();
const SharpeCrowdsale = contract(require('../build/contracts/SharpeCrowdsale.json'));

module.exports = async function(callback) {
    await SharpeCrowdsale.setProvider(provider);
    sharpeCrowdsale = await SharpeCrowdsale.at("0xcD9469cdFc8E13fD7faE5B0DDe9902697D5b848B");
    await sharpeCrowdsale.setShp("0x390409452f99981388c71fce20692565bf7270ad", {
        from: "0x167b7133b1caa3ce98a911df67c3f760889a37be"
    });
    await sharpeCrowdsale.resumeContribution({
        from: "0x167b7133b1caa3ce98a911df67c3f760889a37be"
    });
    console.log("SALE HAS BEEN FINALIZED");
}