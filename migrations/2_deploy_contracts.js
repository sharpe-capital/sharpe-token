var SharpeToken = artifacts.require("./SharpeToken.sol");

module.exports = async function(deployer) {
    deployer.deploy(SharpeToken, 10000);
};