const TradeLedger = artifacts.require("./TradeLedger");

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(TradeLedger);
};