var SharpeToken = artifacts.require("./SharpeToken.sol");

module.exports = function(deployer) {
    deployer.deploy(SharpeToken);
};